/* Copyright © 2010-2023 Richard Rodger and other contributors, MIT License. */
'use strict'

const Assert = require('assert')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const Common = require('../lib/common')

const lab = (exports.lab = Lab.script())
const describe = lab.describe
const assert = Assert
const expect = Code.expect

const Shared = require('./shared')
const it = Shared.make_it(lab)

describe('common', function () {
  it('stringify', function (fin) {
    expect(Common.stringify({})).equal('{}')
    expect(Common.stringify({ a: 1 })).equal('{"a":1}')
    fin()
  })

  it('misc', function (fin) {
    expect(Common.resolve_option(1)).equal(1)
    expect(Common.resolve_option('a')).equal('a')
    expect(
      Common.resolve_option(function () {
        return 'b'
      }),
    ).equal('b')
    expect(
      Common.resolve_option(
        function (opts) {
          return opts.c
        },
        { c: 2 },
      ),
    ).equal(2)

    fin()
  })

  it('deep-empty', function (fin) {
    assert.equal(1, Common.deep({ a: 1 }).a)

    assert.equal(null, Common.deep({}).a)

    assert.equal(1, Common.deep({ a: 1 }).a)

    assert.equal(1, Common.deep({}, { a: 1 }).a)
    assert.equal(1, Common.deep({ a: 1 }, {}).a)

    assert.equal(1, Common.deep({}, { a: 1 }, { b: 2 }).a)
    assert.equal(2, Common.deep({}, { a: 1 }, { b: 2 }).b)

    assert.equal(1, Common.deep({ a: 1 }, { b: 2 }, {}).a)
    assert.equal(2, Common.deep({ a: 1 }, { b: 2 }, {}).b)

    assert.equal(1, Common.deep({}, { a: 1 }, { b: 2 }, {}).a)
    assert.equal(2, Common.deep({}, { a: 1 }, { b: 2 }, {}).b)

    assert.equal(1, Common.deep({}, { a: 1 }, {}, { b: 2 }, {}).a)
    assert.equal(2, Common.deep({}, { a: 1 }, {}, { b: 2 }, {}).b)

    assert.equal(1, Common.deep({ a: { b: 1 } }, {}).a.b)
    assert.equal(1, Common.deep({}, { a: { b: 1 } }).a.b)

    assert.equal(1, Common.deep({ a: { b: 1 } }, { c: { d: 2 } }, {}).a.b)
    assert.equal(2, Common.deep({ a: { b: 1 } }, { c: { d: 2 } }, {}).c.d)

    assert.equal(1, Common.deep({}, { a: { b: 1 } }, { c: { d: 2 } }).a.b)
    assert.equal(2, Common.deep({}, { a: { b: 1 } }, { c: { d: 2 } }).c.d)

    assert.equal(1, Common.deep({}, { a: { b: 1 } }, { c: { d: 2 } }, {}).a.b)
    assert.equal(2, Common.deep({}, { a: { b: 1 } }, { c: { d: 2 } }, {}).c.d)

    assert.equal(
      1,
      Common.deep({}, { a: { b: 1 } }, {}, { c: { d: 2 } }, {}).a.b,
    )
    assert.equal(
      2,
      Common.deep({}, { a: { b: 1 } }, {}, { c: { d: 2 } }, {}).c.d,
    )

    assert.equal(1, Common.deep({ a: { b: 1 } }, { a: { c: 2 } }, {}).a.b)
    assert.equal(2, Common.deep({ a: { b: 1 } }, { a: { c: 2 } }, {}).a.c)

    assert.equal(1, Common.deep({}, { a: { b: 1 } }, { a: { c: 2 } }).a.b)
    assert.equal(2, Common.deep({}, { a: { b: 1 } }, { a: { c: 2 } }).a.c)

    assert.equal(1, Common.deep({}, { a: { b: 1 } }, { a: { c: 2 } }, {}).a.b)
    assert.equal(2, Common.deep({}, { a: { b: 1 } }, { a: { c: 2 } }, {}).a.c)

    assert.equal(
      1,
      Common.deep({}, { a: { b: 1 } }, {}, { a: { c: 2 } }, {}).a.b,
    )
    assert.equal(
      2,
      Common.deep({}, { a: { b: 1 } }, {}, { a: { c: 2 } }, {}).a.c,
    )

    assert.equal(1, Common.deep({ a: { b: 1 } }, { a: { b: 1 } }, {}).a.b)

    assert.equal(2, Common.deep({}, { a: { b: 1 } }, { a: { b: 2 } }).a.b)

    assert.equal(2, Common.deep({}, { a: { b: 1 } }, { a: { b: 2 } }, {}).a.b)

    assert.equal(
      2,
      Common.deep({}, { a: { b: 1 } }, {}, { a: { b: 2 } }, {}).a.b,
    )

    fin()
  })

  it('deep-dups', function (fin) {
    var aa = { a: { aa: 1 } }
    var bb = { a: { bb: 2 } }

    var out = Common.deep(aa, bb, aa)

    assert.equal(1, out.a.aa)
    assert.equal(2, out.a.bb)

    out = Common.deep({}, aa, bb, aa)
    assert.equal(1, out.a.aa)
    assert.equal(2, out.a.bb)
    fin()
  })

  it('deep-objs', function (fin) {
    var d = {
      s: 's',
      n: 100,
      d: new Date(),
      f: function () {},
      a: arguments,
      r: /a/,
      b: Buffer.from('b'),
    }
    var o = Common.deep({}, d)
    assert.equal('' + o, '' + d)
    fin()
  })

  it('deep-objs with functions', function (fin) {
    function noop() {}
    function f1() {}

    var defaults = {
      a: noop,
      b: noop,
    }
    var options = {
      a: f1,
    }

    var out = Common.deep(defaults, options)

    assert.strictEqual(out.a, f1)
    assert.strictEqual(out.b, noop)
    fin()
  })

  it('pattern', function (fin) {
    assert.equal('a:1', Common.pattern('a:1'))
    assert.equal('a:1', Common.pattern({ a: 1 }))
    assert.equal('a:1,b:2', Common.pattern({ a: 1, b: 2 }))
    assert.equal('a:1,b:2', Common.pattern({ a: 1, b: 2, c$: 3 }))
    assert.equal('a:1,b:2', Common.pattern({ b: 2, c$: 3, a: 1 }))
    assert.equal('a:1,b:2', Common.pattern({ b: 2, c: { x: 1 }, a: 1 }))
    assert.equal('a:1,b:2', Common.pattern({ b: 2, c: () => {}, a: 1 }))
    fin()
  })

  it('pincanon', function (fin) {
    assert.equal('a:1', Common.pincanon({ a: 1 }))
    assert.equal('a:1', Common.pincanon([{ a: 1 }]))
    assert.equal('a:1', Common.pincanon('a:1'))
    assert.equal('a:1', Common.pincanon(['a:1']))

    assert.equal('a:1,b:2', Common.pincanon({ b: 2, a: 1 }))
    assert.equal('a:1,b:2', Common.pincanon([{ b: 2, a: 1 }]))
    assert.equal('a:1,b:2', Common.pincanon('b:2,a:1'))
    assert.equal('a:1,b:2', Common.pincanon(['b:2,a:1']))

    assert.equal('a:1;b:2', Common.pincanon([{ b: 2 }, { a: 1 }]))
    assert.equal('a:1;b:2', Common.pincanon(['b:2', 'a:1']))
    assert.equal('a:1;b:2', Common.pincanon(['b:2', { a: 1 }]))
    assert.equal('a:1;b:2', Common.pincanon([{ b: 2 }, 'a:1']))
    fin()
  })

  it('history', function (fin) {
    function itemlist(item) {
      return item.id + '~' + item.timelimit
    }

    var h0 = Common.history()

    h0.add({ id: 'a0', timelimit: 100 })
    expect(h0._list.map(itemlist)).equal(['a0~100'])

    h0.add({ id: 'a1', timelimit: 200 })
    expect(h0._list.map(itemlist)).equal(['a0~100', 'a1~200'])

    h0.add({ id: 'a2', timelimit: 300 })
    expect(h0._list.map(itemlist)).equal(['a0~100', 'a1~200', 'a2~300'])

    h0.add({ id: 'a3', timelimit: 200 })
    expect(h0._list.map(itemlist)).equal([
      'a0~100',
      'a1~200',
      'a3~200',
      'a2~300',
    ])

    h0.add({ id: 'a4', timelimit: 300 })
    expect(h0._list.map(itemlist)).equal([
      'a0~100',
      'a1~200',
      'a3~200',
      'a2~300',
      'a4~300',
    ])

    h0.add({ id: 'a5', timelimit: 100 })
    expect(h0._list.map(itemlist)).equal([
      'a0~100',
      'a5~100',
      'a1~200',
      'a3~200',
      'a2~300',
      'a4~300',
    ])

    expect(Object.keys(h0._map)).equal(['a0', 'a1', 'a2', 'a3', 'a4', 'a5'])

    h0.add({ id: 'a6', timelimit: 101 })
    expect(h0._list.map(itemlist)).equal([
      'a0~100',
      'a5~100',
      'a6~101',
      'a1~200',
      'a3~200',
      'a2~300',
      'a4~300',
    ])

    h0.add({ id: 'a7', timelimit: 199 })
    expect(h0._list.map(itemlist)).equal([
      'a0~100',
      'a5~100',
      'a6~101',
      'a7~199',
      'a1~200',
      'a3~200',
      'a2~300',
      'a4~300',
    ])

    h0.prune(99)
    expect(h0._list.map(itemlist)).equal([
      'a0~100',
      'a5~100',
      'a6~101',
      'a7~199',
      'a1~200',
      'a3~200',
      'a2~300',
      'a4~300',
    ])

    h0.prune(100)
    expect(h0._list.map(itemlist)).equal([
      'a6~101',
      'a7~199',
      'a1~200',
      'a3~200',
      'a2~300',
      'a4~300',
    ])

    h0.prune(101)
    expect(h0._list.map(itemlist)).equal([
      'a7~199',
      'a1~200',
      'a3~200',
      'a2~300',
      'a4~300',
    ])

    h0.prune(299)
    expect(h0._list.map(itemlist)).equal(['a2~300', 'a4~300'])

    h0.prune(299)
    expect(h0._list.map(itemlist)).equal(['a2~300', 'a4~300'])

    h0.prune(300)
    expect(h0._list.map(itemlist)).equal([])

    var h1 = Common.history()

    h1.add({ id: 'a0', timelimit: 100 })
    expect(h1._list.map(itemlist)).equal(['a0~100'])

    h1.add({ id: 'a1', timelimit: 50 })
    expect(h1._list.map(itemlist)).equal(['a1~50', 'a0~100'])

    h1.add({ id: 'a2', timelimit: 25 })
    expect(h1._list.map(itemlist)).equal(['a2~25', 'a1~50', 'a0~100'])

    expect(Object.keys(h1._map)).equal(['a0', 'a1', 'a2'])

    h1.prune(0)
    expect(h1._list.map(itemlist)).equal(['a2~25', 'a1~50', 'a0~100'])

    h1.prune(25)
    expect(h1._list.map(itemlist)).equal(['a1~50', 'a0~100'])

    h1.prune(100)
    expect(h1._list.map(itemlist)).equal([])

    var h2 = Common.history()

    h2.add({ id: 'a0', timelimit: 100 })
    expect(h2._list.map(itemlist)).equal(['a0~100'])

    h2.add({ id: 'a1', timelimit: 200 })
    expect(h2._list.map(itemlist)).equal(['a0~100', 'a1~200'])

    h2.add({ id: 'a2', timelimit: 150 })
    expect(h2._list.map(itemlist)).equal(['a0~100', 'a2~150', 'a1~200'])

    h2.add({ id: 'a3', timelimit: 125 })
    expect(h2._list.map(itemlist)).equal([
      'a0~100',
      'a3~125',
      'a2~150',
      'a1~200',
    ])

    h2.add({ id: 'a4', timelimit: 175 })
    expect(h2._list.map(itemlist)).equal([
      'a0~100',
      'a3~125',
      'a2~150',
      'a4~175',
      'a1~200',
    ])

    expect(Object.keys(h2._map)).equal(['a0', 'a1', 'a2', 'a3', 'a4'])

    fin()
  })

  it('clean', function (fin) {
    expect(Common.clean({})).equal({})
    expect(Common.clean({ a: 1 })).equal({ a: 1 })
    expect(Common.clean({ b$: 2, a: 1 })).equal({ a: 1 })
    expect(Common.clean({ b$: 2 })).equal({})

    expect(Common.clean([])).equal([])
    expect(Common.clean([1])).equal([1])
    expect(Common.clean([1, 2])).equal([1, 2])

    var a = [1, 2, 3]
    a.foo = 4
    a.bar$ = 5
    var ca = Common.clean(a)
    expect(ca).equal([1, 2, 3])
    expect(ca.foo).equal(4)
    expect(ca.bar$).not.exist()

    fin()
  })

  it('parse_jsonic', function (fin) {
    expect(Common.parse_jsonic('a:b')).equal({ a: 'b' })
    expect(Common.parse_jsonic('\na:b')).equal({ a: 'b' })

    try {
      Common.parse_jsonic('a::')
      expect(false).true()
    } catch (e) {
      expect(e.code).equals('bad_jsonic')
    }

    try {
      Common.parse_jsonic('\n\na::\n\n  x}')
      expect(false).true()
    } catch (e) {
      expect(e.code).equals('bad_jsonic')
    }

    fin()
  })

  it('make_plugin_key', function (fin) {
    expect(Common.make_plugin_key('foo')).equal('foo')
    expect(Common.make_plugin_key('foo', '0')).equal('foo$0')
    expect(Common.make_plugin_key('foo', 0)).equal('foo$0')
    expect(Common.make_plugin_key('foo$0')).equal('foo$0')
    expect(Common.make_plugin_key({ name: 'foo' }, '0')).equal('foo$0')
    expect(Common.make_plugin_key({ name: 'foo', tag: '0' })).equal('foo$0')
    expect(Common.make_plugin_key({ name: 'foo', tag: '0' }, 'a')).equal(
      'foo$0',
    )

    expect(Common.make_plugin_key('foo.1~2-3$_')).equal('foo.1~2-3$_')

    try {
      Common.make_plugin_key()
      expect(false).true()
    } catch (e) {
      expect(e.code).equals('missing_plugin_name')
    }

    try {
      Common.make_plugin_key({})
      expect(false).true()
    } catch (e) {
      expect(e.code).equals('bad_plugin_name')
    }

    try {
      Common.make_plugin_key('')
      expect(false).true()
    } catch (e) {
      expect(e.code).equals('bad_plugin_name')
    }

    try {
      Common.make_plugin_key('$')
      expect(false).true()
    } catch (e) {
      expect(e.code).equals('bad_plugin_name')
    }

    try {
      Common.make_plugin_key('a', '$')
      expect(false).true()
    } catch (e) {
      expect(e.code).equals('bad_plugin_tag')
    }

    var b = []
    for (var i = 0; i < 1026; i++) {
      b.push('b')
    }
    var s = b.join('')

    try {
      Common.make_plugin_key(s)
      expect(false).true()
    } catch (e) {
      expect(e.code).equals('bad_plugin_name')
    }

    try {
      Common.make_plugin_key('a', s)
      expect(false).true()
    } catch (e) {
      expect(e.code).equals('bad_plugin_tag')
    }

    fin()
  })
})
