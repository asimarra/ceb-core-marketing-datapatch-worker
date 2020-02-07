const chai = require('chai');
const expect = chai.expect;
const oracleMapper = require('./queryMapper');

it('returns a new object based on given map', () => {
  const map = {
    foo: 'tfoo',
    tar: 'ttar'
  };

  const src = {
    foo: 'foo',
    tar: 'tar'
  };

  const result = oracleMapper(map, src);

  expect(result).to.eql({
    tfoo: 'foo',
    ttar: 'tar'
  });
});

it('returns an object containing only source props', () => {
  const map = {
    foo: 'tfoo',
    tar: 'ttar'
  };

  const src = { foo: 'foo' };

  const result = oracleMapper(map, src);
  expect(result).to.eql({ tfoo: 'foo' });
});

it('returns a new object xxxxx', () => {
  const map = {
    foo: 'tfoo'
  };

  const src = {
    foo: 'foo',
    tar: 'tar'
  };

  const result = oracleMapper(map, src);

  expect(result).to.eql({ tfoo: 'foo' });
});

it('retuns an empty object when empty source', () => {
  const map = {
    foo: 'tfoo',
    tar: 'ttar'
  };

  const result = oracleMapper(map, {});
  expect(result).to.eql({});
});

it('retuns an empty object when no source', () => {
  const map = {
    foo: 'tfoo',
    tar: 'ttar'
  };

  const result = oracleMapper(map, undefined);
  expect(result).to.eql({});
});

it('retuns an empty object when null source', () => {
  const map = {
    foo: 'tfoo',
    tar: 'ttar'
  };

  const result = oracleMapper(map, null);
  expect(result).to.eql({});
});

it('retuns an empty object when source is not an object', () => {
  const map = {
    foo: 'tfoo',
    tar: 'ttar'
  };

  const result = oracleMapper(map, 'foo');
  expect(result).to.eql({});
});

it('throws an error when empty map', () => {
  const src = {
    foo: 'foo',
    tar: 'tar'
  };

  expect(() => {
    oracleMapper({}, src);
  }).to.throw(Error);
});

it('throws an error when null map', () => {
  const src = {
    foo: 'foo',
    tar: 'tar'
  };

  expect(() => {
    oracleMapper(null, src);
  }).to.throw(Error);
});

it('throws an error when undefined map', () => {
  const src = {
    foo: 'foo',
    tar: 'tar'
  };

  expect(() => {
    oracleMapper(undefined, src);
  }).to.throw(Error);
});

it('throws an error when map is not an object', () => {
  const src = {
    foo: 'foo',
    tar: 'tar'
  };

  expect(() => {
    oracleMapper(999, src);
  }).to.throw(Error);

  expect(() => {
    oracleMapper('foo', src);
  }).to.throw(Error);

  expect(() => {
    oracleMapper(true, src);
  }).to.throw(Error);
});
