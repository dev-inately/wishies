const chai = require('chai');

const app = require('../src/app');
const request = require('chai-http');

const expect = chai.expect;

describe('Home Test', ()=> {
    let server;
    before(async()=> {
        await db.connect();  
        server = request(app);
    })
    it('Should go home 😑', ()=> {
        it('should get home', async () => {
            const res = await server
              .get('/');
            console.log(res.body);
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('message');
          });
    })
})