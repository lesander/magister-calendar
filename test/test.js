/* eslint-env mocha */
const assert = require('assert')

const tools = require('../assets/tools')

describe('Tools', function () {
  describe('#validateJSON', function () {
    it('should return false when the string contains bogus JSON', function () {
      assert.strictEqual(tools.validateJSON('{sdfs:sdfsd}'), false)
    })
    it('should return true when the string contains valid JSON', function () {
      assert.strictEqual(tools.validateJSON('{"sdfs":"sdfs"}'), true)
    })
  })
  describe('#pad', function () {
    it('should return the same digits if n >= 10', function () {
      assert.strictEqual(tools.pad(10), '10')
    })
    it('should return the same digits if n <= -1', function () {
      assert.strictEqual(tools.pad(-1), '-1')
    })
    it('should return a padded version otherwise', function () {
      assert.strictEqual(tools.pad(1), '01')
    })
  })
})
