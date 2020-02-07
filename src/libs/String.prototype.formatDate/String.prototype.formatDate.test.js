require('./index')
const { expect } = require("chai");

const string = "08/16/2018 00:00:00 America/Bogota"

describe(`When String.prototype.fomatDate is called`, () => {
    describe(`When a format is passed in options`, () => {
        it(`Should return the date in the format passed`, () => {
            expect(string.formatDate({ format: 'DD/MM/YYYY' })).eql(`16/08/2018`)
        })
    })

    describe(`When include hours is specified in options`, () => {
        it(`Should return the date in the format passed`, () => {
            expect(string.formatDate({ includeHours: true })).eql(`2018-08-16 00:00:00`)
        })
    })

    describe(`When include Timezone is specified in options`, () => {
        it(`Should return the date in the format passed`, () => {
            expect(string.formatDate({ includeHours: true, includeTimezone: true })).eql(`2018-08-16 00:00:00 America/Bogota`)
        })
    })

    describe(`When include Timezone is specified but include hours doesn't in options`, () => {
        it(`Should return the date in the format passed`, () => {
            expect(string.formatDate({ includeTimezone: true })).eql(`2018-08-16 America/Bogota`)
        })
    })

    describe(`When include Timezone and a format  is specified but include hours doesn't in options`, () => {
        it(`Should return the date in the format passed`, () => {
            expect(string.formatDate({ format: 'YYYY-DD-MM', includeTimezone: true })).eql(`2018-16-08 America/Bogota`)
        })
    })

    describe(`When include hours and a format  is specified but include TimeZone doesn't in options`, () => {
        it(`Should return the date in the format passed`, () => {
            expect(string.formatDate({ format: 'YYYY-DD-MM', includeHours: true })).eql(`2018-16-08 00:00:00`)
        })
    })

})