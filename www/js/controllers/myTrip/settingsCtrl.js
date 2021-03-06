App.controller('settingsCtrl', function($scope,$rootScope, $ionicModal, $timeout,$state,$ionicLoading, $ionicPopup,serv, WebService,$http,$cordovaToast) {

	$scope.signUp = {};
  $scope.pic;
  $scope.gallery = function () {
    var options = {sourceType: Camera.PictureSourceType.PHOTOLIBRARY, targetWidth: 400, targetHeight: 400};
    navigator.camera.getPicture(function cameraSuccess(imageUri) {
      window.resolveLocalFileSystemURL(imageUri, function (fileEntry) {
        fileEntry.file(function (file) {
          var reader = new FileReader();
          reader.onloadend = function (evt) {
            $scope.pic = evt.target.result;
            $('.avatar').removeClass('ion-camera');
          };
          reader.readAsDataURL(file);
        });
      });
    }, function cameraError(error) {
      $cordovaToast.showShortBottom("خطا در انتخاب عکس")
    }, options);
  };
  $scope.do_update = function() {
    WebService.startLoading();
      var url = "https://spot.cfapps.io/api/1/editUser";
      var data = {
        name: $("#name").val(),
        tel: $("#tel").val(),
        pic : $scope.pic
      };
      $http.post(url, data)
        .success(function (suc) {
          WebService.stopLoading();
          $ionicPopup.alert({
            title: '<p class="text-center color-yellow">' + "پیام" + '</p>',
            template: '<p class="text-center color-gery">' + "ویرایش پروفایل با موفقیت انجام شد" +'</p>'
          });
        }).error(function (err) {
        WebService.stopLoading();
        WebService.myErrorHandler(err,false);
      });
	};
  $scope.changePass = function() {
    WebService.startLoading();
      var url = "https://spot.cfapps.io/api/1/changePassword";
      var data = {
        pass: $("#c_pwd").val()
      };
      $http.post(url, data)
        .success(function (suc) {
          WebService.stopLoading();
          $ionicPopup.alert({
            title: '<p class="text-center color-yellow">' + "پیام" + '</p>',
            template: '<p class="text-center color-gery">' + "تغییر کلمه عبور با موفقیت انجام شد" +'</p>'
          });
        }).error(function (err) {
        WebService.stopLoading();
        WebService.myErrorHandler(err,false);
      });
	}

  delete $http.defaults.headers.common.Authorization;
  $scope.$on('$ionicView.beforeEnter', function (e, viewData) {
    $scope.$root.showMenuIcon = false;
    viewData.enableBack = true;
  });
  $scope.username = "";
  $scope.password = "";
  $scope.confirmPass = "";
  $scope.submit = function (username) {
    WebService.startLoading();
    var signUpUrl = "https://spot.cfapps.io/api/1/forget";
    $http.post(signUpUrl, username)
      .success(function (suc) {
        if (suc == "201") {
          $ionicPopup.alert({
            title: '<span class="myText">خطا</span>',
            template: '<div class="myText" style="text-align: right">نام کاربری اشتباه می باشد</div>'
          });
        } else {
          $ionicPopup.alert({
            title: '<span class="myText">پیام</span>',
            template: '<div class="myText" style="text-align: right;direction: rtl">کد مورد نیاز برای تغییر کلمه عبور پیامک شد</div>'
          });
          $(".popup").css("width", "90%");
          $scope.forgetPassCodeForm = true;
        }
        WebService.stopLoading();
      })
      .error(function (err) {
        WebService.myErrorHandler(err);
        WebService.stopLoading();
      });
  };
  $scope.confirm = function (code, password) {
    var signUpUrl = "https://spot.cfapps.io/api/1/confirmReset";
    $http.post(signUpUrl, JSON.stringify({code: code, password: password}))
      .success(function (suc) {
        WebService.stopLoading();
        if (suc == "200") {
          $ionicPopup.alert({
            title: '<span class="myText">پیام</span>',
            template: '<div class="myText" style="text-align: right;direction: rtl">کلمه عبور با موفقیت تغییر کرد</div>'
          });
          $ionicNativeTransitions.stateGo('menuless.login', {}, {
            "type": "slide",
            "direction": "right",
            "duration": 500
          });
        } else if (suc == "301") {
          $ionicPopup.alert({
            title: '<span class="myText">پیام</span>',
            template: '<div class="myText" style="text-align: right;direction: rtl">خطا در عملیات. لطفا مجددا تلاش کنید</div>'
          });
        } else {
          $ionicPopup.alert({
            title: '<span class="myText">پیام</span>',
            template: '<div class="myText" style="text-align: right;direction: rtl">کد اشتباه می باشد</div>'
          });
        }
        $(".popup").css("width", "90%");
      })
      .error(function (err) {
        WebService.myErrorHandler(err);
        WebService.stopLoading();
      });
  };
  $scope.checkPassword = function (form, password, confirmPass) {
    var result = password !== confirmPass;
    $scope.result = result;
    form.confirmPass.$setValidity("validity", !result);
  };

  $scope.setType = function (type) {
    $rootScope.projectType = type;
    $state.go("app.landing");
  };
  $scope.goToPack = function () {
    $state.go("app.package");
  }
});
App.controller('packageCtrl', function ($scope, $rootScope, $state,$timeout,WebService,$http,$ionicModal,$ionicPopup) {
  $timeout(function () {
    WebService.startLoading();
    $http.defaults.headers.common.Authorization = $rootScope.token;
    $http({
      method: "POST",
      url: "https://spot.cfapps.io/api/1/listPakage"
    }).then(function (resp) {
      WebService.stopLoading();
      $rootScope.list = resp.data;
    }, function (err) {
      WebService.stopLoading();
      WebService.myErrorHandler(err, false);
    });
  }, 600);
  $scope.selected = function (index) {
    $scope.selectedPack = $scope.list[index];
    $ionicModal.fromTemplateUrl('templates/pack-select.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.modal.payment = modal;
      modal.show();
    });
  }
  $scope.buy = function () {
    WebService.startLoading();
    $http.defaults.headers.common.Authorization = $rootScope.token;
    var url = "https://spot.cfapps.io/api/1/factor";
    $http.post(url, $scope.selectedPack.price + "," + $rootScope.username + "," + $scope.selectedPack.id + ",1,1").success(function (data, status, headers, config) {
      WebService.stopLoading();
      window.open(
        "http://dagala.ir/bank.html?res=" + data + "&amount=" + parseInt($scope.selectedPack.price),
        "_system",
        "hidden=no,location=no,clearsessioncache=yes,clearcache=yes"
      );
    }).catch(function (err) {
      WebService.stopLoading();
      WebService.handleError(err);
    });
  }
});

