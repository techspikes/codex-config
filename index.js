const bareKey = /^[A-Za-z0-9_-]+$/
const integer = /^[+-]?(?:0|[1-9](?:_?[0-9])*)$/
const float = /^[+-]?(?:0|[1-9](?:_?[0-9])*)(?:\.[0-9](?:_?[0-9])*(?:[eE][+-]?[0-9](?:_?[0-9])*)?|[eE][+-]?[0-9](?:_?[0-9])*)$/
const escapes = { b: '\b', t: '\t', n: '\n', f: '\f', r: '\r', '"': '"', '\\': '\\' }

export function parse (source) {
  if (typeof source !== 'string') {
    throw new TypeError('Expected TOML text')
  } else {
    source = source.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  }

  const root = {}
  let position = 0
  let current = root

  // Track how tables were created so conflicting declarations can be detected.
  const tables = new WeakMap()
  const tableArrays = new WeakSet()

  function fail (message) {
    const prefix = source.slice(0, position)
    const line = prefix.split('\n').length
    const column = position - prefix.lastIndexOf('\n')

    throw new SyntaxError(message + ' at line ' + line + ', column ' + column)
  }

  function take (token) {
    if (!source.startsWith(token, position)) {
      return false
    }

    position += token.length

    return true
  }

  function expect (token) {
    if (!take(token)) {
      fail('Expected ' + JSON.stringify(token))
    }
  }

  function match (pattern) {
    pattern.lastIndex = position

    const result = pattern.exec(source)

    if (result) {
      position = pattern.lastIndex
    }

    return result?.[0]
  }

  function character () {
    const code = source.codePointAt(position)

    if ((code < 32 && code !== 9 && code !== 10) || code === 127 || (code >= 0xd800 && code <= 0xdfff)) {
      fail('Invalid character')
    }

    const result = String.fromCodePoint(code)

    position += result.length

    return result
  }

  function spaces () {
    match(/[ \t]+/y)
  }

  function comment () {
    if (!take('#')) {
      return
    }

    while (position < source.length && source[position] !== '\n') {
      character()
    }
  }

  function layout () {
    do {
      spaces()
      comment()
    } while (take('\n'))
  }

  function string (quote, multiline) {
    // A newline immediately after the opening delimiter is trimmed.
    if (multiline) {
      take('\n')
    }

    let result = ''

    while (position < source.length) {
      if (source[position] === quote) {
        if (!multiline) {
          position++

          return result
        }

        if (take(quote.repeat(3))) {
          // A closing delimiter can carry up to two trailing quotes as content.
          for (let i = 0; i < 2 && take(quote); i++) {
            result += quote
          }

          return result
        }
      }

      if (!multiline && source[position] === '\n') {
        fail('Unexpected newline in string')
      }

      if (quote !== '"' || !take('\\')) {
        result += character()
        continue
      }

      // A line-ending backslash trims whitespace up to the next content.
      if (multiline && match(/[ \t]*\n[ \t\n]*/y)) {
        continue
      }

      const escape = source[position++]

      if (Object.hasOwn(escapes, escape)) {
        result += escapes[escape]
      } else if (escape === 'u' || escape === 'U') {
        const digits = match(escape === 'u' ? /[A-Fa-f0-9]{4}/y : /[A-Fa-f0-9]{8}/y)
        const code = Number.parseInt(digits, 16)

        if (!digits || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) {
          fail('Invalid Unicode escape')
        }

        result += String.fromCodePoint(code)
      } else {
        fail('Invalid string escape')
      }
    }

    fail('Unclosed string')
  }

  function keyPath () {
    const path = []

    do {
      spaces()

      const quote = source[position]

      let key

      if (quote === '"' || quote === "'") {
        position++
        key = string(quote, false)
      } else {
        key = match(/[A-Za-z0-9_-]+/y)
      }

      if (key === undefined) {
        fail('Expected a key')
      }

      path.push(key)

      spaces()
    } while (take('.'))

    return path
  }

  function set (object, key, value) {
    // Define a data property even when the key is "__proto__".
    Object.defineProperty(object, key, { value, enumerable: true, writable: true, configurable: true })
  }

  function parent (object, path, header) {
    for (const key of path) {
      if (!Object.hasOwn(object, key)) {
        const child = {}

        tables.set(child, header ? 'implicit' : 'dotted')

        set(object, key, child)
      }

      let child = object[key]

      // A subtable header belongs to the most recent item of an array of tables.
      if (header && tableArrays.has(child)) {
        child = child.at(-1)
      }

      const kind = tables.get(child)

      if (!kind || (!header && kind === 'explicit')) {
        fail('Conflicting table definition')
      }

      if (!header && kind === 'implicit') {
        tables.set(child, 'dotted')
      }

      object = child
    }

    return object
  }

  function assignment (object) {
    const path = keyPath()

    expect('=')
    spaces()

    const key = path.pop()
    const target = parent(object, path, false)

    if (Object.hasOwn(target, key)) {
      fail('Duplicate key')
    }

    set(target, key, value())
  }

  function value () {
    const quote = source[position]

    if (quote === '"' || quote === "'") {
      const multiline = take(quote.repeat(3))

      if (!multiline) {
        position++
      }

      return string(quote, multiline)
    }

    if (take('[')) {
      const result = []

      layout()

      while (!take(']')) {
        result.push(value())

        layout()

        if (take(']')) {
          break
        }

        expect(',')
        layout()
      }

      return result
    }

    if (take('{')) {
      const result = {}

      spaces()

      if (!take('}')) {
        do {
          spaces()
          assignment(result)
          spaces()
        } while (take(','))

        expect('}')
      }

      return result
    }

    const token = match(/[^ \t\n,\]#}]+/y)

    if (token === 'true' || token === 'false') {
      return token === 'true'
    }

    const whole = integer.test(token)

    if (whole || float.test(token)) {
      const number = Number(token.replaceAll('_', ''))

      if (!Number.isFinite(number) || (whole && !Number.isSafeInteger(number))) {
        fail('Number outside supported range')
      }

      return number === 0 ? 0 : number
    }

    fail('Invalid or unsupported value')
  }

  layout()

  while (position < source.length) {
    if (take('[')) {
      const array = take('[')
      const path = keyPath()

      expect(array ? ']]' : ']')

      const key = path.pop()
      const object = parent(root, path, true)
      const existing = Object.hasOwn(object, key) ? object[key] : undefined

      if (array) {
        const items = existing === undefined ? [] : existing

        if (existing !== undefined && !tableArrays.has(items)) {
          fail('Conflicting table array definition')
        }

        tableArrays.add(items)
        set(object, key, items)

        current = {}

        items.push(current)
      } else {
        if (existing !== undefined && tables.get(existing) !== 'implicit') {
          fail('Duplicate or conflicting table')
        }

        current = existing ?? {}

        set(object, key, current)
      }

      tables.set(current, 'explicit')
    } else {
      assignment(current)
    }

    spaces()
    comment()

    if (position < source.length) {
      expect('\n')
    }

    layout()
  }

  return root
}

function quote (value) {
  if (!value.isWellFormed()) {
    throw new TypeError('Expected a well-formed string')
  }

  return JSON.stringify(value).replaceAll('\x7f', '\\u007f')
}

function key (value) {
  return bareKey.test(value) ? value : quote(value)
}

function isTable (value) {
  if (value === null || typeof value !== 'object') {
    return false
  }

  const prototype = Object.getPrototypeOf(value)

  return prototype === Object.prototype || prototype === null
}

export function merge (destination, source, { removeMissing = false } = {}) {
  if (!isTable(destination) || !isTable(source)) {
    throw new TypeError('Expected two configuration objects')
  }

  function mergeTables (destination, source) {
    const entries = new Map(removeMissing ? [] : Object.entries(destination))

    for (const [key, value] of Object.entries(source)) {
      const previous = Object.hasOwn(destination, key) ? destination[key] : undefined
      entries.set(key, isTable(previous) && isTable(value) ? mergeTables(previous, value) : value)
    }

    return Object.fromEntries(entries)
  }

  // Detach retained and replacement values so the result can be edited independently.
  return structuredClone(mergeTables(destination, source))
}

export function stringify (config) {
  if (!isTable(config)) {
    throw new TypeError('Expected a configuration object')
  }

  // Track only the active path so shared values can be serialized more than once.
  const active = new Set()
  const lines = []

  function enter (value) {
    if (active.has(value)) {
      throw new TypeError('Cannot write circular configuration data')
    }

    active.add(value)
  }

  function format (value) {
    if (typeof value === 'string') {
      return quote(value)
    }

    if (typeof value === 'boolean') {
      return String(value)
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      const text = String(value)

      // Keep large integer-valued numbers in TOML float syntax for round trips.
      return Number.isInteger(value) && !Number.isSafeInteger(value) && !text.includes('e') ? text + '.0' : text
    }

    if (Array.isArray(value) || isTable(value)) {
      enter(value)

      let text

      if (Array.isArray(value)) {
        const items = []

        for (let i = 0; i < value.length; i++) {
          if (!Object.hasOwn(value, i)) {
            throw new TypeError('Cannot write a sparse array')
          }

          items.push(format(value[i]))
        }

        text = '[' + items.join(', ') + ']'
      } else {
        text = '{ ' + Object.entries(value).map(([name, item]) => key(name) + ' = ' + format(item)).join(', ') + ' }'
      }

      active.delete(value)

      return text
    }

    throw new TypeError('Unsupported configuration value')
  }

  function table (object, path) {
    enter(object)

    const entries = Object.entries(object)

    // Parent headers can be implicit when the table only contains subtables.
    if (path.length && (entries.length === 0 || entries.some(([, value]) => !isTable(value)))) {
      if (lines.length) {
        lines.push('')
      }

      lines.push('[' + path.join('.') + ']')
    }

    // Direct values must be written before a child header changes the current table.
    const children = []

    for (const [name, value] of entries) {
      if (isTable(value)) {
        children.push([name, value])
      } else {
        lines.push(key(name) + ' = ' + format(value))
      }
    }

    for (const [name, value] of children) {
      table(value, [...path, key(name)])
    }

    active.delete(object)
  }

  table(config, [])

  return lines.length ? lines.join('\n') + '\n' : ''
}
