/* Copyright (c) 2016-2017 Richard Rodger, MIT License */
'use strict'

var Util = require('util')

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')

var lab = (exports.lab = Lab.script())
var describe = lab.describe
var expect = Code.expect

var Shared = require('./shared')
var it = Shared.make_it(lab)

var { Outward } = require('../lib/outward')
var { API } = require('../lib/api')

describe('outward', function () {
  it('make_error', function (fin) {
    var err = { message: 'foo', meta$: { err: true } }
    var data = { meta: { error: true }, res: err }

    Outward.outward_make_error({
      ctx: { options: { legacy: { error: false } } },
      data,
    })
    expect(data.res.message).equal('foo')
    expect(Util.isError(data.res)).false()

    data = { res: err }
    Outward.outward_make_error({
      ctx: { options: { legacy: { error: true } } },
      data,
    })
    expect(data.res.message).equal('foo')
    expect(!Util.isError(data.res)).true()

    fin()
  })

  it('act_stats', function (fin) {
    var private$ = {
      stats: { act: { done: 0 }, actmap: {} },
      timestats: { point: function () {} },
    }
    Outward.outward_act_stats({
      ctx: { actdef: { pattern: 'foo:1' }, seneca: { private$: private$ } },
      data: { meta: {} },
    })
    expect(private$.stats.act.done).equal(1)
    fin()
  })

  it('arg-check', function (fin) {
    try {
      API.outward()
      expect(false).true()
    } catch (e) {
      expect(e.message).equal(
        'seneca: Validation failed for property "outward"' +
          ' with value "undefined" because the value is required.',
      )
      expect({ ...e }).includes({
        gubu: true,
        code: 'shape',
      })
      expect(e.props[0]).includes({
        path: 'outward',
        type: 'function',
      })
    }

    fin()
  })
})
