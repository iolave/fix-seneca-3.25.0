/* Copyright (c) 2019 Richard Rodger and other contributors, MIT License */
'use strict'

const Code = require('@hapi/code')
const Lab = require('@hapi/lab')

var lab = (exports.lab = Lab.script())
var describe = lab.describe
var expect = Code.expect

var Shared = require('./shared')
var it = Shared.make_it(lab)

var Seneca = require('..')

describe('add', function () {
  it('action-name', function (fin) {
    var si = Seneca().test()

    si.add('n:0')
      .add('n:1', function () {})
      .add('n:2', function n2() {})

    // NOTE: these may need to be updated if startup action call sequence changes.

    expect(si.find('n:0')).contains({
      id: 'root$/default_action/6',
      name: 'default_action',
    })

    expect(si.find('n:1')).contains({
      id: 'root$/action/7',
      name: 'action',
    })

    expect(si.find('n:2')).contains({
      id: 'root$/n2/8',
      name: 'n2',
    })

    si.use(function p0() {
      this.add('p:0', function f0(msg, reply) {
        reply({ x: 1 })
      })
    }).ready(function () {
      expect(si.find('p:0')).contains({
        id: 'p0/f0/10',
        name: 'f0',
      })

      fin()
    })
  })

  it('action_modifier', function (fin) {
    var si = Seneca().test()

    si.private$.action_modifiers.push(function (actdef) {
      actdef.desc = actdef.func.desc
    })

    si.add({ a: 1 }, a1)

    a1.validate = { b: 2 }
    a1.desc = 'The ubiquitous a1 action.'
    function a1(m, r) {
      r()
    }

    si.ready(function () {
      var actdef = si.find('a:1')
      expect(actdef.rules.b).equal(2)
      expect(actdef.desc).equal('The ubiquitous a1 action.')
      fin()
    })
  })

  
  it('rules-basic', function (fin) {
    const si = Seneca({ legacy: false })
          .test()
          .quiet()

    si
      .add({ a: 1, b: Number }, function (m, r) {
        r({ b: m.b * 2 })
      })
      .add('a:2', { b: Number }, function (m, r) {
        r({ b: m.b * 3 })
      })

    si.act({ a: 1, b: 2 }, function (e, o) {
      expect(e).not.exist()
      expect(o).equal({ b: 4 })

      this.act({ a: 1, b: 'x' }, function (e, o) {
        expect(e).exist()
        expect(o).not.exist()
        // console.log(e)
        expect(e.code).equal('act_invalid_msg')
        expect(e.message).equal(
          'seneca: Action a:1 received an invalid message; Validation failed for property "b" with string "x" because the string is not of type number.; message content was: { a: 1, b: \'x\' }.'
        )

        si.act({ a: 2, b: 3 }, function (e, o) {
          expect(e).not.exist()
          expect(o).equal({ b: 9 })

          this.act({ a: 2, b: 'x' }, function (e, o) {
            expect(e).exist()
            expect(o).not.exist()
            expect(e.code).equal('act_invalid_msg')
            expect(e.message).equal(
              'seneca: Action a:2 received an invalid message; Validation failed for property "b" with string "x" because the string is not of type number.; message content was: { a: 2, b: \'x\' }.'
            )

            fin()
          })
        })
      })
    })
  })

  it('rules-builders', function (fin) {
    const si = Seneca({ log: 'silent' }) //.test()
    const { Required } = si.valid

    si.add({ a: 1, b: Required({ x: Number }) }, function (m, r) {
      r({ b: m.b.x * 2 })
    })

    si.act({ a: 1, b: { x: 2 } }, function (e, o) {
      expect(e).not.exist()
      expect(o).equal({ b: 4 })

      this.act({ a: 1 }, function (e, o) {
        expect(e).exist()
        expect(o).not.exist()
        expect(e.code).equal('act_invalid_msg')
        expect(e.message).equal(
          'seneca: Action a:1 received an invalid message; Validation failed for property "b" with value "undefined" because the value is required.; message content was: { a: 1 }.'
        )
        fin()
      })
    })
  })

  it('rules-scalars', function (fin) {
    const si = Seneca({legacy:false})
          .test()
          .quiet()
    const { Required, Default } = si.valid

    si.add({ a: 1, b: Default(2) }, function (m, r) {
      r({ x: m.b * 2 })
    })

    si.act({ a: 1 }, function (e, o) {
      expect(e).not.exist()
      expect(o).equal({ x: 4 })

      this.act({ a: 1, b: 'q' }, function (e, o) {
        expect(e).exist()
        expect(o).not.exist()
        expect(e.code).equal('act_invalid_msg')
        expect(e.message).equal(
          'seneca: Action a:1 received an invalid message; Validation failed for property "b" with string "q" because the string is not of type number.; message content was: { a: 1, b: \'q\' }.'
        )
        fin()
      })
    })
  })

  
  it('rules-deep', function (fin) {
    const si = Seneca({ legacy: false })
          .test()
          .quiet()
    si.add({ a: 1, b: { c: 2 } }, function (m, r) {
      r({ r: m.b.c * 2 })
    }).add({ a: 2, d: { f: Boolean } }, function (m, r) {
      r({ r: m.b.c * 2 })
    })

    si.act({ a: 1 }, function (e, o) {
      expect(e).not.exist()
      expect(o).equal({ r: 4 })

      this.act({ a: 2 }, function (e, o) {
        expect(e).exist()
        expect(o).not.exist()
        expect(e.code).equal('act_invalid_msg')
        expect(e.message).equal(
          'seneca: Action a:2 received an invalid message; Validation failed for property "d.f" with value "undefined" because the value is required.; message content was: { a: 2, d: {} }.'
        )
        fin()
      })
    })
  })
})
