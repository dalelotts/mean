// Showing requests service used to communicate Showing requests REST endpoints
(function () {
  'use strict';

  angular
    .module('showing-requests')
    .factory('ShowingRequestsService', ShowingRequestsService);

  ShowingRequestsService.$inject = ['$resource'];

  function ShowingRequestsService($resource) {
    return $resource('api/showing-requests/:showingRequestId', {
      showingRequestId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
}());
