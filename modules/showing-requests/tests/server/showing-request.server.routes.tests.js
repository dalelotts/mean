'use strict';

var should = require('should');
const request = require('supertest');
const path = require('path');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const ShowingRequest = mongoose.model('ShowingRequest');
const express = require(path.resolve('./config/lib/express'));

/**
 * Globals
 */
var app;
var agent;
var credentials;
var user;
var showingRequest;

/**
 * Showing Request routes tests
 */
describe('Showing Request CRUD tests', function () {

  before(function (done) {
    // Get application
    app = express.init(mongoose);
    agent = request.agent(app);

    done();
  });

  beforeEach(function (done) {
    // Create user credentials
    credentials = {
      usernameOrEmail: 'username',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create a new user
    user = new User({
      firstName: 'Full',
      lastName: 'Name',
      displayName: 'Full Name',
      email: 'test@test.com',
      username: credentials.usernameOrEmail,
      password: credentials.password,
      provider: 'local'
    });

    // Save a user to the test db and create new Showing Request
    user.save(function (err, savedUser) {
      showingRequest = {
        name: 'Showing Request name',
        user: savedUser
      };

      done(err);
    });
  });

  it('should be able to save a Showing Request if logged in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new Showing Request
        agent.post('/api/showing-requests')
          .send(showingRequest)
          .expect(200)
          .end(function (showingRequestSaveErr, showingRequestSaveRes) {
            // Handle Showing Request save error
            if (showingRequestSaveErr) {
              return done(showingRequestSaveErr);
            }

            // Get a list of Showing Requests
            agent.get('/api/showing-requests')
              .end(function (showingRequestsGetErr, showingRequestsGetRes) {
                // Handle Showing Requests save error
                if (showingRequestsGetErr) {
                  return done(showingRequestsGetErr);
                }

                // Get Showing Requests list
                var showingRequests = showingRequestsGetRes.body;

                // Set assertions
                (showingRequests[0].user._id).should.equal(userId);
                (showingRequests[0].name).should.match('Showing Request name');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to save an Showing Request if not logged in', function (done) {
    agent.post('/api/showing-requests')
      .send(showingRequest)
      .expect(403)
      .end(function (showingRequestSaveErr, showingRequestSaveRes) {
        // Call the assertion callback
        done(showingRequestSaveErr);
      });
  });

  it('should not be able to save an Showing Request if no name is provided', function (done) {
    // Invalidate name field
    showingRequest.name = '';

    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Save a new Showing Request
        agent.post('/api/showing-requests')
          .send(showingRequest)
          .expect(400)
          .end(function (err, res) {
            // Set message assertion
            console.log(res.body);

            res.body.should.be.instanceof(Object).and.have.property('message', 'Please fill Showing Request name');

            // Handle Showing Request save error
            done(err);
          });
      });
  });

  it('should be able to update an Showing Request if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new Showing Request
        agent.post('/api/showing-requests')
          .send(showingRequest)
          .expect(200)
          .end(function (showingRequestSaveErr, showingRequestSaveRes) {
            // Handle Showing Request save error
            if (showingRequestSaveErr) {
              return done(showingRequestSaveErr);
            }

            // Update Showing Request name
            showingRequest.name = 'WHY YOU GOTTA BE SO MEAN?';

            // Update an existing Showing Request
            agent.put('/api/showing-requests/' + showingRequestSaveRes.body._id)
              .send(showingRequest)
              .expect(200)
              .end(function (showingRequestUpdateErr, showingRequestUpdateRes) {
                // Handle Showing Request update error
                if (showingRequestUpdateErr) {
                  return done(showingRequestUpdateErr);
                }

                // Set assertions
                (showingRequestUpdateRes.body._id).should.equal(showingRequestSaveRes.body._id);
                (showingRequestUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should be able to get a list of Showing Requests if not signed in', function (done) {
    // Create new Showing Request model instance
    var showingRequestObj = new ShowingRequest(showingRequest);

    // Save the showingRequest
    showingRequestObj.save(function () {
      // Request Showing Requests
      request(app).get('/api/showing-requests')
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Array).and.have.lengthOf(1);

          // Call the assertion callback
          done();
        });

    });
  });

  it('should be able to get a single Showing Request if not signed in', function (done) {
    // Create new Showing Request model instance
    var showingRequestObj = new ShowingRequest(showingRequest);

    // Save the Showing Request
    showingRequestObj.save(function () {
      request(app).get('/api/showing-requests/' + showingRequestObj._id)
        .end(function (req, res) {
          // Set assertion
          res.body.should.be.instanceof(Object).and.have.property('name', showingRequest.name);

          // Call the assertion callback
          done();
        });
    });
  });

  it('should return proper error for single Showing Request with an invalid Id, if not signed in', function (done) {
    // test is not a valid mongoose Id
    request(app).get('/api/showing-requests/test')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'Showing Request is invalid');

        // Call the assertion callback
        done();
      });
  });

  it('should return proper error for single Showing Request which doesnt exist, if not signed in', function (done) {
    // This is a valid mongoose Id but a non-existent Showing Request
    request(app).get('/api/showing-requests/559e9cd815f80b4c256a8f41')
      .end(function (req, res) {
        // Set assertion
        res.body.should.be.instanceof(Object).and.have.property('message', 'No Showing Request with that identifier has been found');

        // Call the assertion callback
        done();
      });
  });

  it('should be able to delete an Showing Request if signed in', function (done) {
    agent.post('/api/auth/signin')
      .send(credentials)
      .expect(200)
      .end(function (signinErr, signinRes) {
        // Handle signin error
        if (signinErr) {
          return done(signinErr);
        }

        // Get the userId
        var userId = user.id;

        // Save a new Showing Request
        agent.post('/api/showing-requests')
          .send(showingRequest)
          .expect(200)
          .end(function (showingRequestSaveErr, showingRequestSaveRes) {
            // Handle Showing Request save error
            if (showingRequestSaveErr) {
              return done(showingRequestSaveErr);
            }

            // Delete an existing Showing Request
            agent.delete('/api/showing-requests/' + showingRequestSaveRes.body._id)
              .send(showingRequest)
              .expect(200)
              .end(function (showingRequestDeleteErr, showingRequestDeleteRes) {
                // Handle showingRequest error error
                if (showingRequestDeleteErr) {
                  return done(showingRequestDeleteErr);
                }

                // Set assertions
                (showingRequestDeleteRes.body._id).should.equal(showingRequestSaveRes.body._id);

                // Call the assertion callback
                done();
              });
          });
      });
  });

  it('should not be able to delete an Showing Request if not signed in', function (done) {
    // Set Showing Request user
    showingRequest.user = user;

    // Create new Showing Request model instance
    var showingRequestObj = new ShowingRequest(showingRequest);

    // Save the Showing Request
    showingRequestObj.save(function () {
      // Try deleting Showing Request
      request(app).delete('/api/showing-requests/' + showingRequestObj._id)
        .expect(403)
        .end(function (showingRequestDeleteErr, showingRequestDeleteRes) {
          // Set message assertion
          (showingRequestDeleteRes.body.message).should.match('User is not authorized');

          // Handle Showing Request error error
          done(showingRequestDeleteErr);
        });

    });
  });

  it('should be able to get a single Showing Request that has an orphaned user reference', function (done) {
    // Create orphan user creds
    var _creds = {
      usernameOrEmail: 'orphan',
      password: 'M3@n.jsI$Aw3$0m3'
    };

    // Create orphan user
    var _orphan = new User({
      firstName: 'Orphan',
      lastName: 'Test',
      displayName: 'Orphan Test',
      email: 'orphan@test.com',
      username: _creds.usernameOrEmail,
      password: _creds.password,
      provider: 'local'
    });

    _orphan.save(function (err, orphan) {
      // Handle save error
      if (err) {
        return done(err);
      }

      agent.post('/api/auth/signin')
        .send(_creds)
        .expect(200)
        .end(function (signinErr, signinRes) {
          // Handle signin error
          if (signinErr) {
            return done(signinErr);
          }

          // Get the userId
          var orphanId = orphan._id;

          // Save a new Showing Request
          agent.post('/api/showing-requests')
            .send(showingRequest)
            .expect(200)
            .end(function (showingRequestSaveErr, showingRequestSaveRes) {
              // Handle Showing Request save error
              if (showingRequestSaveErr) {
                return done(showingRequestSaveErr);
              }

              // Set assertions on new Showing Request
              (showingRequestSaveRes.body.name).should.equal(showingRequest.name);
              should.exist(showingRequestSaveRes.body.user);
              should.equal(showingRequestSaveRes.body.user._id, orphanId);

              // force the Showing Request to have an orphaned user reference
              orphan.remove(function () {
                // now signin with valid user
                agent.post('/api/auth/signin')
                  .send(credentials)
                  .expect(200)
                  .end(function (err, res) {
                    // Handle signin error
                    if (err) {
                      return done(err);
                    }

                    // Get the Showing Request
                    agent.get('/api/showing-requests/' + showingRequestSaveRes.body._id)
                      .expect(200)
                      .end(function (showingRequestInfoErr, showingRequestInfoRes) {
                        // Handle Showing Request error
                        if (showingRequestInfoErr) {
                          return done(showingRequestInfoErr);
                        }

                        // Set assertions
                        (showingRequestInfoRes.body._id).should.equal(showingRequestSaveRes.body._id);
                        (showingRequestInfoRes.body.name).should.equal(showingRequest.name);
                        should.equal(showingRequestInfoRes.body.user, undefined);

                        // Call the assertion callback
                        done();
                      });
                  });
              });
            });
        });
    });
  });

  afterEach(function (done) {
    User.remove().exec(function () {
      ShowingRequest.remove().exec(done);
    });
  });
});
