'use strict';

const _ = require('lodash');
const ViewModel = require('../../lib/view-model');

describe('ViewModel', () => {
    const sandbox = sinon.sandbox.create();

    const mkViewModel_ = () =>{
        const config = {forBrowser: sandbox.stub().returns({})};
        return new ViewModel(config);
    };

    const getModelResult_ = (model) => model.getResult().suites[0].children[0].browsers[0].result;

    const stubTest_ = (opts) => {
        opts = opts || {};

        return _.defaultsDeep(opts, {
            state: {name: 'name-default'},
            suite: {
                path: ['suite'],
                metaInfo: {sessionId: 'sessionId-default'},
                file: 'default/path/file.js'
            }
        });
    };

    it('should contain "file" in "metaInfo"', () => {
        const model = mkViewModel_();

        model.addSuccess(stubTest_({
            suite: {file: '/path/file.js'}
        }));

        const metaInfo = JSON.parse(getModelResult_(model).metaInfo);

        assert.equal(metaInfo.file, '/path/file.js');
    });

    it('should contain "url" in "metaInfo"', () => {
        const model = mkViewModel_();

        model.addSuccess(stubTest_({
            suite: {fullUrl: '/test/url'}
        }));

        const metaInfo = JSON.parse(getModelResult_(model).metaInfo);

        assert.equal(metaInfo.url, '/test/url');
    });

    it('should extend passed statistic', () => {
        const model = mkViewModel_();

        assert.match(model.getResult({foo: 'bar'}), {foo: 'bar'});
    });

    it('should not modify passed statistic', () => {
        const model = mkViewModel_();
        const stat = {foo: 'bar'};

        model.getResult(stat);

        assert.deepEqual(stat, {foo: 'bar'});
    });

    it('should add skipped test to result', () => {
        const model = mkViewModel_();

        model.addSkipped(stubTest_({
            browserId: 'bro1',
            suite: {
                skipComment: 'some skip comment',
                fullName: 'suite-full-name'
            }
        }));

        assert.deepEqual(model.getResult().skips, [{
            suite: 'suite-full-name',
            browser: 'bro1',
            comment: 'some skip comment'
        }]);
    });

    it('should add success test to result', () => {
        const model = mkViewModel_();

        model.addSuccess(stubTest_({
            state: {name: 'some-state-name'},
            browserId: 'bro1'
        }));

        assert.match(getModelResult_(model), {
            success: true,
            actualPath: 'images/suite/some-state-name/bro1~current.png',
            expectedPath: 'images/suite/some-state-name/bro1~ref.png'
        });
    });

    it('should add failed test to result', () => {
        const model = mkViewModel_();

        model.addFail(stubTest_({
            state: {name: 'some-state-name'},
            browserId: 'bro1'
        }));

        assert.match(getModelResult_(model), {
            fail: true,
            actualPath: 'images/suite/some-state-name/bro1~current.png',
            expectedPath: 'images/suite/some-state-name/bro1~ref.png'
        });
    });

    it('should add error test to result', () => {
        const model = mkViewModel_();

        model.addError(stubTest_({stack: 'some-stack-trace'}));

        assert.match(getModelResult_(model), {
            error: true,
            reason: 'some-stack-trace'
        });
    });

    describe('addRetry', () => {
        it('should add fail to result if test result has image', () => {
            const model = mkViewModel_();

            model.addRetry(stubTest_({equal: false}));

            assert.match(getModelResult_(model), {fail: true});
        });

        it('should add error to result if test result has no image', () => {
            const model = mkViewModel_();

            model.addRetry(stubTest_());

            assert.match(getModelResult_(model), {error: true});
        });
    });
});
