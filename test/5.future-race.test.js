'use strict';

const expect = require('chai').expect;
const Future = require('../fluture.js');
const U = require('./util');
const type = require('sanctuary-type-identifiers');

const testInstance = race => {

  it('is considered a member of fluture/Fluture', () => {
    const m1 = Future((rej, res) => void setTimeout(res, 15, 1));
    const m2 = Future(rej => void setTimeout(rej, 5, U.error));
    expect(type(race(m1, m2))).to.equal('fluture/Future');
  });

  describe('#fork()', () => {

    it('rejects when the first one rejects', () => {
      const m1 = Future((rej, res) => void setTimeout(res, 15, 1));
      const m2 = Future(rej => void setTimeout(rej, 5, U.error));
      return U.assertRejected(race(m1, m2), U.error);
    });

    it('resolves when the first one resolves', () => {
      const m1 = Future((rej, res) => void setTimeout(res, 5, 1));
      const m2 = Future(rej => void setTimeout(rej, 15, U.error));
      return U.assertResolved(race(m1, m2), 1);
    });

    it('cancels the slower computation', done => {
      const m1 = Future((rej, res) => void setTimeout(res, 5, 1));
      const m2 = Future(() => () => done());
      race(m1, m2).fork(U.noop, U.noop);
    });

    it('creates a cancel function which cancels both Futures', done => {
      let cancelled = false;
      const m = Future(() => () => (cancelled ? done() : (cancelled = true)));
      const cancel = race(m, m).fork(U.noop, U.noop);
      cancel();
    });

  });

  describe('#toString()', () => {

    it('returns the code to create the FutureRace', () => {
      const m = race(Future.of(1), Future.of(2));
      const s = 'Future.of(1).race(Future.of(2))';
      expect(m.toString()).to.equal(s);
    });

  });

};

describe('Future.race()', () => {

  it('is a curried binary function', () => {
    expect(Future.race).to.be.a('function');
    expect(Future.race.length).to.equal(2);
    expect(Future.race(Future.of(1))).to.be.a('function');
  });

  it('throws when not given a Future as first argument', () => {
    const f = () => Future.race(1);
    expect(f).to.throw(TypeError, /Future.*first/);
  });

  it('throws when not given a Future as second argument', () => {
    const f = () => Future.race(Future.of(1), 1);
    expect(f).to.throw(TypeError, /Future.*second/);
  });

  testInstance((a, b) => Future.race(b, a));

});

describe('Future#race()', () => {

  it('throws when invoked out of context', () => {
    const f = () => Future.of(1).race.call(null, Future.of(1));
    expect(f).to.throw(TypeError, /Future/);
  });

  it('throws TypeError when not given a Future', () => {
    const xs = [NaN, {}, [], 1, 'a', new Date, undefined, null, x => x];
    const fs = xs.map(x => () => Future.of(1).race(x));
    fs.forEach(f => expect(f).to.throw(TypeError, /Future/));
  });

  testInstance((a, b) => a.race(b));

});
