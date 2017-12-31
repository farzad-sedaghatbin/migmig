App.controller('IntroCtrl', function ($scope, $state, $ionicSlideBoxDelegate) {

  // Called to navigate to the main app
  $scope.startApp = function () {
    $state.go('landing');
  };
  $scope.next = function () {
    $ionicSlideBoxDelegate.next();
  };
  $scope.previous = function () {
    $ionicSlideBoxDelegate.previous();
  };

  // Called each time the slide changes
  $scope.slideChanged = function (index) {
    $scope.slideIndex = index;
  };
});


App.controller('myTripCtrl', function ($scope, $rootScope, $ionicLoading, $compile, $ionicModal, $window, $timeout, $state, $http, WebService) {

  /* JAVASCRIPT
   ===========================*/
  function animate_Trip_item() {
    $('#content-tab-area').addClass('hidden');

    $timeout(function () {
      $('#content-tab-area').removeClass('hidden');
    }, 300);
  }

  $scope.myTrip_menu = [
    {'name': 'کامل شده'},
    {'name': 'درحال انجام'},
    {'name': 'رزرو شده'}
  ];
  //$scope.myTrip_menu_selected = 0;
  $scope.Trip_menu_click = function (index) {
    if ($rootScope.myTrip_menu_selected != index) {

      $rootScope.myTrip_menu_selected = index;
      if (index == 0) {
        $rootScope.active_trip = $rootScope.complete;
      } else if (index == 1) {
        $rootScope.active_trip = $rootScope.inProgress;
      } else if (index == 2) {
        $rootScope.active_trip = $rootScope.reserved;
      }
      animate_Trip_item();
    }
  };
  $scope.show_details = function (uid) {
    WebService.startLoading();
    $http.defaults.headers.common.Authorization = $rootScope.token;
    $http({
      method: "POST",
      url: "https://spot.cfapps.io/api/1/detail",
      data: uid
    }).then(function (resp) {
      WebService.stopLoading();
      $rootScope.details = resp.data;
      $state.go("app.tripDetials")
    }, function (err) {
      WebService.stopLoading();
      WebService.myErrorHandler(err, false);
    });
  };
  $scope.showFrom = function () {
    $state.go("app.navigation");
  }

});
