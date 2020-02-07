const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const { Readable } = require('stream');
const config = require('./../knexfile');
const knex = require('knex')(config);

const executeReturn = {
  outBinds: {
    creturn: {
      toQueryStream: () => {
        const inStream = new Readable();
        inStream.push('a');
        inStream.push('b');
        inStream.push('c');
        inStream.push(null);
        return inStream;
      }
    },
    return: 3
  }
};

let acquireConnection;
let execute;
let oracleHelpers;

beforeEach(() => {
  acquireConnection = sinon.stub(knex.client, 'acquireConnection');

  execute = sinon.stub();
  execute.returns(executeReturn);
  acquireConnection.returns(Promise.resolve({ execute }));

  oracleHelpers = require('./oracle')(knex);
});

afterEach(() => {
  acquireConnection.restore();
});

describe('buildParameters', () => {
  it('returns the right object when simple parameters are passed', () => {
    let parameters = oracleHelpers.buildParameters({ a: 1, b: 2 });
    expect(parameters.parameters).to.eql({ a: 1, b: 2 });
    expect(parameters.bindVariables).to.eql('a => :a, b => :b');
  });

  it('returns the right object creturn is passed as parameter', () => {
    let parameters = oracleHelpers.buildParameters({ a: 1, b: 2, creturn: '' });
    expect(parameters.parameters).to.eql({
      a: 1,
      b: 2,
      creturn: { type: 2004, dir: 3003 }
    });
    expect(parameters.bindVariables).to.eql(
      'a => :a, b => :b, creturn => :creturn'
    );
  });

  it('returns the right object array is passed as parameter', () => {
    let parameters = oracleHelpers.buildParameters({
      a: 1,
      b: 2,
      c: [1, 2]
    });
    expect(parameters.parameters).to.eql({
      a: 1,
      b: 2,
      c: { type: 2002, dir: 3001, val: [1, 2] }
    });
    expect(parameters.bindVariables).to.eql('a => :a, b => :b, c => :c');
  });
});

describe('receiveStream', () => {
  it('returns the correct data', done => {
    const inStream = new Readable();
    inStream.push('a');
    inStream.push('b');
    inStream.push('c');
    inStream.push(null); // No more data
    const exp = [
      Buffer.from('a', 'utf8'),
      Buffer.from('b', 'utf8'),
      Buffer.from('c', 'utf8')
    ];
    oracleHelpers.receiveStream(inStream).then(data => {
      expect(data).to.eql(exp);
      done();
    });
  });
});

describe('executeProcedure', () => {
  it('is called with the right parameters', async () => {
    await oracleHelpers.executeProcedure('fake_procedure', { a: 1 });
    expect(execute.calledWith(
      'BEGIN fake_procedure(a => :a, creturn => :creturn); END;',
      { a: 1, creturn: { type: 2004, dir: 3003 } }
    )).to.be.true;
  });

  it('returns the right data', async () => {
    const data = await oracleHelpers.executeProcedure('sadf', { a: 1 });
    const exp = [
      Buffer.from('a', 'utf8'),
      Buffer.from('b', 'utf8'),
      Buffer.from('c', 'utf8')
    ];
    expect(data).to.eql(exp);
  });
});

describe('executeFunction', () => {
  it('is called with the right parameters', async () => {
    await oracleHelpers.executeFunction('fake_function', { a: 1 });
    expect(execute.calledWith('BEGIN :return := fake_function(a => :a); END;', {
      a: 1,
      return: { dir: 3003, type: 2001, maxSize: 4000 }
    })).to.be.true;
  });

  it('returns the right data', async () => {
    const data = await oracleHelpers.executeFunction('fake_function', { a: 1 });
    expect(data).to.eql(3);
  });
});

describe('executeNonQuery', () => {
  it('is called with the right parameters', async () => {
    await oracleHelpers.executeNonQuery('fake_procedure', { a: 1 });
    expect(execute.calledWith('BEGIN fake_procedure(a => :a); END;', { a: 1 })).to.be.true;
  });
});

describe('executeNonQueryTrx', () => {
  it('is called with the right parameters', async () => {
    let raw = sinon.stub(knex, 'raw');
    raw.returns({ transacting: () => { } });
    await oracleHelpers.executeNonQueryTrx('fake_procedure', { a: 1 }, {});
    expect(raw.calledWith('BEGIN fake_procedure(a => :a); END;', { a: 1 })).to.be.true;
    raw.restore();
  });
});
