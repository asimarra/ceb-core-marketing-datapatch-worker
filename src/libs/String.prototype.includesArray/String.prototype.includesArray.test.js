require('./index')
const { expect } = require("chai");

const string = `hello,this,is,a,test`

describe(`When String.prototype.includesArray is called`, () => {
    it(`need to return TRUE when at least one word is in the string`, () => {
        expect(string.includesArray(['this'])).to.eql(true)
    })

    it(`need to return FALSE when the words specified are not in the string`, () => {
        expect(string.includesArray(['bad'])).to.eql(false)
    })
})