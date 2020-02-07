require('./index')
const { expect } = require("chai");

const object = {
    id_owner: 1,
    cd_account_type: 'BAS',
    nullValue: null
}

describe(`When Object.prototype.prepareData is called`, () => {
    it(`need to return an array with the columns array and values array`, () => {
        expect(object.prepareDataUpdate()).eql(`id_owner=1, cd_account_type="BAS", nullValue=NULL`)
    })
})