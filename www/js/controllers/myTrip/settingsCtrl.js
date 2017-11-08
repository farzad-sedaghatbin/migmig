App.controller('settingsCtrl', function($scope,$rootScope, $ionicModal, $timeout,$state,$ionicLoading, $ionicPopup,serv, WebService,$http) {

	$scope.signUp = {};
  $scope.pic;
  $scope.gallery = function () {
    var options = {sourceType: Camera.PictureSourceType.PHOTOLIBRARY, targetWidth: 400, targetHeight: 400};
    navigator.camera.getPicture(function cameraSuccess(imageUri) {
      menuService.startLoading();
      window.resolveLocalFileSystemURL(imageUri, function (fileEntry) {
        fileEntry.file(function (file) {
          var reader = new FileReader();
          reader.onloadend = function (evt) {
            $scope.pic = evt.target.result;
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
      var url = "http://192.168.160.172:8080/api/1/editUser";
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
      var url = "http://192.168.160.172:8080/api/1/changePassword";
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
});
