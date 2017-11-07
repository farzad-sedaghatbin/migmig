var App = angular.module('CallAppcontrollers', []);

App.controller('AppCtrl', function ($scope, $rootScope, $cordovaNetwork, $ionicModal, $timeout,$interval, $state, $ionicLoading, $ionicPopup, $http, $cordovaOauth, $cordovaSplashscreen, $ionicHistory, serv, WebService) {

  //localStorage.removeItem('user_data');

  //$cordovaSplashscreen.show();

  function set_net(status) {
    if (status == 'online') {
      $('.net-error').hide();
      $ionicLoading.hide();
    } else {
      $('.net-error').show();
      WebService.show_loading();
    }

  }

  //
  // if( $cordovaNetwork.isOffline() ){
  //
  // 	set_net('offline');
  //
  // }else{
  if (localStorage.getItem('user_data') === null) {

  } else {

    $rootScope.user_data = JSON.parse(localStorage.getItem('user_data'));
    $ionicHistory.nextViewOptions({
      historyRoot: true
    });

    $state.go('app.landing', {}, {reload: true});
    //$state.go('app.landing');
  }
  // }

  $rootScope.$on('$cordovaNetwork:online', function (event, networkState) {
    set_net('online');
  })

  $rootScope.$on('$cordovaNetwork:offline', function (event, networkState) {
    set_net('offline');
  })


  // Form data for the login modal


  //$scope.sign_up_form = {};

  // Create the login modal that we will use later
  $scope.modal = {};

  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function (modal) {
    $scope.modal.sign_in = modal;
  });

  $ionicModal.fromTemplateUrl('templates/sign-up.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function (modal) {
    $scope.modal.sign_up = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function () {
    $scope.modal.sign_in.hide();
  };

  $scope.closeSignUp = function () {
    $scope.modal.sign_up.hide();
  };


  // Open the login modal
  $scope.show_login1 = function () {
    $scope.login = {};
    $scope.modal.sign_in.show();
  };

  $scope.sign_up = function () {
    $scope.signUp = {};
    $scope.modal.sign_up.show();
  };


  // Perform the login action when the user submits the login form
  $scope.doLogin = function (form) {
    WebService.startLoading();
    if (form.$valid) {
      try {
        delete $http.defaults.headers.common.Authorization;
      }catch (e){
      }
      var url = "http://192.168.160.172:8080/api/1/user_authenticate";
      var data = {
        username: $scope.login.mail,
        password: $scope.login.pwd,
        rememberMe: false
      };
      $http.post(url, data).success(function (data, status, headers, config) {
        WebService.stopLoading();
        $rootScope.username = $scope.login.mail;
        $rootScope.type = data.type;
        $rootScope.userid = data.userid;
        $rootScope.name = data.name;
        $rootScope.tel = data.tel;
        $http.defaults.headers.common.Authorization = "Bearer " + data.token;
        var db = openDatabase('mydb', '1.0', 'Test DB', 1024 * 1024);
        db.transaction(function (tx) {
          tx.executeSql('INSERT INTO ANIJUU (name, log) VALUES (?, ?)', ["username", $scope.login.mail]);
          tx.executeSql('INSERT INTO ANIJUU (name, log) VALUES (?, ?)', ["type", $rootScope.type]);
          tx.executeSql('INSERT INTO ANIJUU (name, log) VALUES (?, ?)', ["userid", $rootScope.userid]);
          tx.executeSql('INSERT INTO ANIJUU (name, log) VALUES (?, ?)', ["name", $rootScope.name]);
          tx.executeSql('INSERT INTO ANIJUU (name, log) VALUES (?, ?)', ["tel", $rootScope.tel]);
          tx.executeSql('INSERT INTO ANIJUU (name, log) VALUES (?, ?)', ["myToken", "Bearer " + data.token]);
        });
        $scope.modal.sign_in.hide();
        if (data.type === "2") {
          $state.go('app.landing', {}, {reload: true});
        } else {
          $state.go('app.photographer', {}, {reload: true});
        }
      }).catch(function (err) {
        WebService.stopLoading();
        WebService.myErrorHandler(err,true);
      });
    } else {
      form.mail.$setDirty();
      form.pwd.$setDirty();
    }

  };

  $scope.signUp = {};
  $scope.do_signUp = function (form) {
    WebService.startLoading();
    //$state.go('view', {movieid: 1});
    if (
      form.$valid
      && $scope.signUp.pwd == $scope.signUp.c_pwd
    //true
    ) {
      var post_data = {
        'secret_key': secret_key,
        'Email': $scope.signUp.mail,
        'Password': $scope.signUp.pwd,
        'Mobile': $scope.signUp.mobile,
        'User_name': $scope.signUp.user_name,
        'Name': $scope.signUp.name,
      }

      var url = "http://192.168.160.172:8080/api/1/signup";
      var data = {
        firstName: $scope.signUp.name,
        lastName: $scope.signUp.name,
        username: $scope.signUp.user_name,
        mobile: $scope.signUp.mobile,
        password: $scope.signUp.pwd
      };
      $http.post(url, data)
        .success(function (suc) {
          WebService.stopLoading();
          $state.go("app.landing");
        }).error(function (err) {
        WebService.stopLoading();
        WebService.myErrorHandler(err,false);
      });
    } else {
      form.pwd.$setDirty();
      form.number.$setDirty();
      form.mail.$setDirty();
      form.name.$setDirty();
      form.user_name.$setDirty();

    }

  };

  // MENU

  $scope.logout = function () {
    localStorage.removeItem('user_data');
    WebService.show_loading();

    $timeout(function () {
      $ionicLoading.hide();
      $ionicHistory.nextViewOptions({
        disableAnimate: true,
        disableBack: true
      });
      $interval.cancel($rootScope.interval);
      $interval.cancel($rootScope.interval2);
      $interval.cancel($rootScope.interval3);
      $state.go('landing', {}, {reload: true});

    }, 1000);
    //$state.go('landing');

  };

  $scope.peyk = function () {
    $state.go("app.peyk");
  };

  $scope.load_trips = function () {
    WebService.startLoading();
    $http({
      method: "POST",
      url: "http://192.168.160.172:8080/api/1/clientOrders"
    }).then(function (resp) {
      WebService.stopLoading();
      $rootScope.complete = resp.data.completedOrders;
      $rootScope.inProgress = resp.data.inProgressOrders;
      $rootScope.reserved = resp.data.reservedOrders;
      $state.go("app.mytrip")
    }, function (err) {
      WebService.stopLoading();
      WebService.myErrorHandler(err,false);
    });
  };
});

