const expect = require('chai').expect;
const okta = require('../../src');
const models = require('../../src/models');
const Collection = require('../../src/collection');
const getMockGenericOidcIdp = require('./mocks/generic-oidc-idp');
const getMockUser = require('./mocks/user-without-credentials');
const utils = require('../utils');
let orgUrl = process.env.OKTA_CLIENT_ORGURL;

if (process.env.OKTA_USE_MOCK) {
  orgUrl = `${orgUrl}/user-idp`;
}

const client = new okta.Client({
  orgUrl: orgUrl,
  token: process.env.OKTA_CLIENT_TOKEN,
  requestExecutor: new okta.DefaultRequestExecutor()
});

describe('User idp API', () => {
  let idp;
  let user;
  before(async () => {
    idp = await client.createIdentityProvider(getMockGenericOidcIdp());
    user = await client.createUser(getMockUser(), { activate: false });
  });

  after(async () => {
    await idp.delete();
    await utils.cleanupUser(client, user);
  });

  describe('List Linked IdPs for User', () => {
    beforeEach(async () => {
      await idp.linkUser(user.id, { externalId: 'externalId' });
    });

    afterEach(async () => {
      await idp.unlinkUser(user.id);
    });

    it('should return a Collection and resolve IdentityProvider in collection', async () => {
      const idps = await user.listIdentityProviders();
      expect(idps).to.be.instanceOf(Collection);
      await idps.each(idpFromCollection => {
        expect(idpFromCollection).to.be.instanceOf(models.IdentityProvider);
        expect(idpFromCollection.id).to.be.equal(idp.id);
      });
    });
  });
});
