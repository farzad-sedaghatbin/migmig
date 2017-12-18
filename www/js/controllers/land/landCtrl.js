App.controller('landCtrl', function ($scope, $rootScope, $q, $http, $ionicLoading, $compile, $cordovaToast, $ionicModal, $window, $timeout, $ionicPopup, landInit, WebService, $filter, $cordovaNativeAudio, $cordovaVibration) {



  /* Funtion For set Map
   =========================================================== */
  var geoloccontrol;

  function set_map() {
    // Create an array of styles.
    var styles = landInit.mapStyles();

    // Create a new StyledMapType object, passing it the array of styles,
    var styledMap = new google.maps.StyledMapType(styles,
      {name: "Styled Map"});
    var myLatlng = new google.maps.LatLng(43.07493, -89.381388);
    var mapOptions = {
      center: myLatlng,
      zoom: 16,
      zoomControl: false,
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
    };
    var map = new google.maps.Map(document.getElementById("map"),
      mapOptions);
    // map.mapTypes.set('map_style', styledMap);
    // map.setMapTypeId('map_style');
    geoloccontrol = new klokantech.GeolocationControl(map, null, null);
    ed(geoloccontrol);
    $scope.map = map;
    $scope.init_status = true;
    setAutocompleteBoxes();
    var input = document.getElementById('autocompletefrom');
    var options = {
      componentRestrictions: {country: "ir"}
    };
    var autocomplete = new google.maps.places.Autocomplete(input, options);
    var container = $(".pac-container");
    if (container.length > 1)
      container[0].remove();
    autocomplete.bindTo('bounds', map);
    input.style.display = "block";
    autocomplete.addListener('place_changed', function () {
      var place = autocomplete.getPlace();
      if (!place.geometry) {
        return;
      }
      if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
      } else {
        map.setCenter(place.geometry.location);
      }
      map.setZoom(16);
    });
  }

  /* Function For Get place from LatLng
   ==================================================*/
  function codeLatLng(lat, lng) {
    $scope.loading = $ionicLoading.show({
      content: 'در حال دریافت مکان موقعیت شما ...',
      showBackdrop: false
    });
    $http({
      method: "POST",
      url: "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + lat + "," + lng + "&sensor=true&language=fa"
    }).then(function (resp) {
      document.getElementById('autocompletefrom').value = resp.data.results[1].formatted_address;
      $scope.fromAddress = resp.data.results[1].formatted_address;
      $scope.Location = resp.data.results[1].formatted_address;
    }, function (err) {
      WebService.myErrorHandler(err, false);
    });
  }

  $scope.getCurrentLocation = function () {
    if (!$scope.map) {
      return;
    }
    /**/
    var image = 'img/icons/google_marker.png';
    /**/
    navigator.geolocation.getCurrentPosition(function (pos) {
      //console.log(pos);
      //alert(JSON.stringify(pos));
      var myLatlng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
      $scope.start_box.lat = pos.coords.latitude;
      $scope.start_box.lng = pos.coords.longitude;

      codeLatLng(pos.coords.latitude, pos.coords.longitude);
      $scope.map.setCenter(myLatlng);
      $ionicLoading.hide();
    }, function (error) {
      $ionicPopup.alert({
        title: '<p class="text-center color-yellow">' + ("پیام") + '</p>',
        template: '<p class="text-center color-gery">' + ("لطفا موقعیت جغرافیایی دستگاه خود را روشن کنید") + '</p>'
      });
      var myLatlng = new google.maps.LatLng(35.796844, 51.453692);
      $scope.start_box.lat = pos.coords.latitude;
      $scope.start_box.lng = pos.coords.longitude;

      codeLatLng(pos.coords.latitude, pos.coords.longitude);
      $scope.map.setCenter(myLatlng);
      $ionicLoading.hide();
    });
  };
  $scope.newTrip = function () {
    resetAllThingsWithoutApply();
    if ($("#my-pop").hasClass("my-active")) {
      animateMyPop();
    }
  };
  $scope.deleteFrom = function () {
    $scope.fromMarker.setMap(null);
    $scope.fromMarker = null;
    document.getElementById('autocompletefrom').value = "";
    animateMyPop();
    $("#request").css("display", "none");
    setAutocompleteBoxes();
  };
  $scope.deleteTo = function () {
    $scope.toMarker.setMap(null);
    document.getElementById('autocompleteto').value = "";
  };

  var numOfClick = 0;
  var client = new WebSocket("wss://spot.cfapps.io:4443/myHandler");
  client.onopen = function () {
    client.send("join," + $rootScope.userid);
  };
  var image = 'img/destination.png';
  var bound = new google.maps.LatLngBounds(null);
  var markers = [];
  var ids = [];
  var delivery = new google.maps.Marker({
    icon: image
  });
  $rootScope.ratingsObject = {
    iconOn: 'ion-ios-star',
    iconOff: 'ion-ios-star-outline',
    iconOnColor: 'rgb(200, 200, 100)',
    iconOffColor: 'rgb(200, 100, 100)',
    rating: 0,
    minRating: 0,
    readOnly: false,
    callback: function (rating) {
      alert(rating)
    }
  };
  delivery.setVisible(false);
  client.onmessage = function (msg) {
    var data = JSON.parse(msg.data);
    switch (data.command) {
      case "aroundme":
        data.aroundmeDTOs.forEach(function (value, key) {
          var loc = new google.maps.LatLng(value.lat, value.longitude);
          var pinIcon = new google.maps.MarkerImage(
            image,
            null,
            null,
            null,
            new google.maps.Size(60, 60)
          );
          var marker = new google.maps.Marker({
            position: loc,
            map: $scope.map,
            title: '',
            icon: pinIcon
          });
          marker.setVisible(true);
          markers.push(marker);
          bound.extend(loc);
        });
        $scope.map.fitBounds(bound);
        break;
      case "driverinfo":
        $("#footer").css("height", "70px");
        $scope.$apply(function () {
          $scope.driver = data.driverInfoDTO;
          $scope.pop_status = 4;
          $scope.showDriverInfo = true;
        });
        markers.forEach(function (value, key) {
          value.setMap(null);
        });
        bound = new google.maps.LatLngBounds(null);
        bound.extend($scope.fromMarker.getPosition());
        bound.extend($scope.toMarker.getPosition());
        break;
      case "delivery":
        if (jQuery.inArray(data.deliveryLocationDTO.id, ids) !== -1) {
          markers.forEach(function (value, key) {
            if (data.deliveryLocationDTO.id === value.id)
              value.setPosition(new google.maps.LatLng(data.deliveryLocationDTO.lat, data.deliveryLocationDTO.lng));
          });
        } else {
          var loc = new google.maps.LatLng(data.deliveryLocationDTO.lat, data.deliveryLocationDTO.lng);
          var pinIcon = new google.maps.MarkerImage(
            image,
            null,
            null,
            null,
            new google.maps.Size(60, 60)
          );
          var marker = new google.maps.Marker({
            position: loc,
            map: $scope.map,
            icon: pinIcon
          });
          marker.name = data.deliveryLocationDTO.name;
          marker.tel = data.deliveryLocationDTO.tel;
          marker.setVisible(true);
          marker.myId = data.deliveryLocationDTO.id;
          google.maps.event.addListener(marker, 'click', function () {
            $("#my-pop").removeClass("my-active");
            if (!$("#my-pop2").hasClass("my-active")) {
              $("#my-pop2").addClass("my-active");
            }
            $scope.showDriverInfo = true;
            $scope.showStart = true;
            $scope.$apply(function () {
              $scope.driver = {
                name: marker.name,
                mobile: marker.tel
              }
            })
          });
          ids.push(data.deliveryLocationDTO.id);
          markers.push(marker);
          if ($scope.start_box.lat) {
            bound.extend(new google.maps.LatLng($scope.start_box.lat, $scope.start_box.lng));
          }
          bound.extend(loc);
          $scope.map.fitBounds(bound);
        }
        break;
      case "reject":
        $ionicPopup.alert({
          title: '<p class="text-center color-yellow">' + $filter('langTranslate')("سفر پرید", $rootScope.appConvertedLang['FAILED']) + '</p>',
          template: '<p class="text-center color-gery">' + $filter('langTranslate')("سفر توسط راننده لغو شد.لطفا مجددا اقدام نمایید.", $rootScope.appConvertedLang['Enter_pickup_location']) + '</p>'
        });
        resetAllThings();
        break;
      case "arrived":
        $cordovaNativeAudio
          .preloadSimple('migmig', 'audio/migmig.mp3');

        $cordovaNativeAudio.play("migmig");
        $cordovaVibration.vibrate(100);
        //todo alert
        $ionicPopup.alert({
          title: '<p class="text-center color-yellow">' + $filter('langTranslate')("راننده رسید", $rootScope.appConvertedLang['FAILED']) + '</p>',
          template: '<p class="text-center color-gery">' + $filter('langTranslate')("راننده به محل مبدا رسیده است", $rootScope.appConvertedLang['Enter_pickup_location']) + '</p>'
        });
        break;
      case "endoftrip":
        $ionicPopup.alert({
          title: '<p class="text-center color-yellow">' + $filter('langTranslate')("اتمام سفر", $rootScope.appConvertedLang['FAILED']) + '</p>',
          template: '<p class="text-center color-gery">' + $filter('langTranslate')("امتیاز شما به این سفر", $rootScope.appConvertedLang['Enter_pickup_location']) + '' +
          '<ionic-ratings ratingsobj="ratingsObject" style="font-size: xx-large;padding-top: 5%;text-align: center"></ionic-ratings></p>'
        });
        resetAllThings();
        break;
    }
  };
  function resetAllThings() {
    $scope.$apply(function () {
      $scope.pop_status = 1;
      $scope.showDriverInfo = false;
    });
    internalReset();
  }

  function resetAllThingsWithoutApply() {
    $scope.pop_status = 1;
    $scope.showDriverInfo = false;
    internalReset();
  }

  function internalReset() {
    delivery.setMap(null);
    document.getElementById('autocompletefrom').value = "";
    document.getElementById('autocompleteto').value = "";
    $scope.fromMarker.setMap(null);
    $scope.toMarker.setMap(null);
    numOfClick = 0;
    markers.forEach(function (value, key) {
      value.setMap(null);
    });
    setAutocompleteBoxes();
    $scope.enableBox = true;
    $("#footer").css("height", "44px");
  }

  var rate;
  $scope.ratingsObject = {
    iconOn: 'ion-ios-star',
    iconOff: 'ion-ios-star-outline',
    iconOnColor: 'rgb(200, 200, 100)',
    iconOffColor: 'rgb(200, 100, 100)',
    rating: 0,
    minRating: 0,
    readOnly: false,
    callback: function (rating) {
      rate = rating;
    }
  };
  $scope.submitRate = function () {
    WebService.startLoading();
    $http.defaults.headers.common.Authorization = $rootScope.token;
    $http({
      method: "POST",
      url: "https://spot.cfapps.io/api/1/rating",
      data: $scope.selected_ph.uid + "," + rate
    }).then(function (resp) {
      WebService.stopLoading();
      $ionicPopup.alert({
        title: '<p class="text-center color-yellow">' + ("پیام") + '</p>',
        template: '<p class="text-center color-gery">' + ("امتیاز شما با موفقیت ثبت شد") + '</p>'
      });
    }, function (err) {
      WebService.stopLoading();
      WebService.myErrorHandler(err, false);
    });
  };
  function setAutocompleteBoxes(data) {
    var from_el = document.getElementById('autocompletefrom');
    var startImage = 'img/source.png';
    var pinIcon = new google.maps.MarkerImage(
      startImage,
      null,
      null,
      null,
      new google.maps.Size(60, 60)
    );
    $scope.fromMarker = new google.maps.Marker({
      position: $scope.map.getCenter(),
      animation: google.maps.Animation.DROP,
      map: $scope.map,
      visible: true,
      icon: pinIcon
    });
    // $scope.fromMarker.setMap($scope.map);
    google.maps.event.trigger($scope.map, 'resize');
    var timer1;
    var l1 = $scope.map.addListener("drag", function (event) {
      if (geoloccontrol.enabled)
        ed(geoloccontrol);
      $scope.fromMarker.setPosition($scope.map.getCenter());
    });
    var l2 = $scope.map.addListener("center_changed", function (event) {
      $scope.fromMarker.setPosition($scope.map.getCenter());
    });
    var l3 = $scope.map.addListener("bounds_changed", function (event) {
      $scope.fromMarker.setPosition($scope.map.getCenter());
    });
    var click = $scope.fromMarker.addListener('click', function () {
      clearTimeout(timer1);
      timer1 = setTimeout(function () {
        google.maps.event.removeListener(l1);
        google.maps.event.removeListener(l2);
        google.maps.event.removeListener(l3);
        google.maps.event.removeListener(click);
        $http({
          method: "POST",
          url: "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + $scope.map.getCenter().lat() + "," + $scope.map.getCenter().lng() + "&sensor=true&language=fa"
        }).then(function (resp) {
          if (resp.data.result && resp.data.result.length > 0) {
            from_el.value = resp.data.results[1].formatted_address;
            $scope.fromAddress = resp.data.results[1].formatted_address;
          }
        }, function (err) {
          WebService.myErrorHandler(err, false);
        });
        WebService.startLoading();
        $http.defaults.headers.common.Authorization = $rootScope.token;
        var url = "https://spot.cfapps.io/api/1/listService";
        $http({
          method: "POST",
          url: url
        }).then(function (resp) {
          animateMyPop();
          $scope.ph = resp.data;
          WebService.stopLoading();
          var date = new Date();
          var jalali = toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
          // $("#year").val(jalali.jy);
          setMonth(jalali.jm);
          setDay(jalali.jd);
        }, function (err) {
          WebService.stopLoading();
          WebService.myErrorHandler(err, false);
        });
      }, 500);

    });

    function setDay(day) {
      for (var i = 0; i < 32; i++) {
        var d = $("#0" + i);
        if (day > parseInt(d.val())) {
          d.css("display", "none")
        }
        if (day === parseInt(d.val())) {
          d.attr('selected', 'selected');
        }
      }
    }

    function setMonth(month) {
      for (var i = 0; i < 13; i++) {
        var d = $("#" + i);
        if (month > parseInt(d.val())) {
          d.css("display", "none")
        }
        if (month === parseInt(d.val())) {
          d.attr('selected', 'selected');
        }
      }
    }

    var options = {
      // componentRestrictions: {country: "in"}
      componentRestrictions: {country: "ir"}
    };
    $scope.from = new google.maps.places.Autocomplete(from_el, options);
    google.maps.event.addListener($scope.from, 'place_changed', function () {

    });

  }

  function animate_tab() {
    $('#tab-hide').addClass('hidden');

    $timeout(function () {
      $('#tab-hide').removeClass('hidden');
    }, 300);
  }

  $scope.Location = 'You are here';
  $rootScope.start_box = {'location': null, 'lat': null, 'lng': null};
  $rootScope.end_box = {'location': null, 'lat': null, 'lng': null};
  $scope.start_box_copy, $scope.end_box_copy , current_box = {}

  $scope.my_model;
  $scope.pop_status = 1;

  /* STARTING Point
   ================================================================*/
  if ($scope.init_status === undefined) {

    set_map();
    $scope.getCurrentLocation();

    var link = 'settings';
    var post_data = {
      //'user_name' : "Point to Point Transfer" ,

    }

    WebService.show_loading();

  }
  $scope.CallNumber = function (number) {
    window.plugins.CallNumber.callNumber(function () {
    }, function () {
    }, number)
  };
  $scope.$on("$ionicView.enter", function (scopes, states) {
    google.maps.event.trigger($scope.map, 'resize');
  });

  function animateMyPop() {
    $('#my-pop').toggleClass('my-active');
    $scope.Trip_Date = null;
  }

  $scope.start = function () {
    cordova.plugins.barcodeScanner.scan(
      function (result) {
        WebService.startLoading();
        $http.defaults.headers.common.Authorization = $rootScope.token;
        $http({
          method: "POST",
          url: "https://spot.cfapps.io/api/1/arrived",
          data: result.text
        }).then(function (resp) {
          WebService.stopLoading();
          $ionicPopup.alert({
            title: '<p class="text-center color-yellow">' + $filter('langTranslate')("پیام") + '</p>',
            template: '<p class="text-center color-gery">' + $filter('langTranslate')("شروع پروژه با موفقیت ثبت شد") + '</p>'
          });
          $scope.showStart = false;
          $scope.showEnd = true;
        }, function (err) {
          WebService.stopLoading();
          WebService.myErrorHandler(err, false);
        });
      },
      function (error) {
        alert("اسکن انجام نشد");
      }
    );
  };
  $scope.end = function () {
    cordova.plugins.barcodeScanner.scan(
      function (result) {
        WebService.startLoading();
        $http.defaults.headers.common.Authorization = $rootScope.token;
        $http({
          method: "POST",
          url: "https://spot.cfapps.io/api/1/endOfShooting",
          data: result.text
        }).then(function (resp) {
          $scope.finalPay = true;
          WebService.stopLoading();
          if (resp.data === 0) {
            $ionicModal.fromTemplateUrl('templates/rate.html', {
              scope: $scope,
              animation: 'slide-in-up'
            }).then(function (modal) {
              $scope.rate = modal;
              modal.show();
            });
          } else {
            $scope.finalCost = resp.data;
            $ionicModal.fromTemplateUrl('templates/deliver-type.html', {
              scope: $scope,
              animation: 'slide-in-up'
            }).then(function (modal) {
              $scope.modal.payment = modal;
              modal.show();
            });
          }
          $scope.showStart = false;
          $scope.showEnd = false;
        }, function (err) {
          WebService.stopLoading();
          WebService.myErrorHandler(err, false);
        });
      },
      function (error) {
        alert("اسکن انجام نشد");
      }
    );
  };
  $scope.ride = function (time) {
    WebService.startLoading();
    $http.defaults.headers.common.Authorization = $rootScope.token;
    $http({
      method: "POST",
      url: "https://spot.cfapps.io/api/1/submitRequest",
      data: {
        dlat: $scope.start_box.lat,
        dlong: $scope.start_box.lng,
        desc: $("#moreInfo").val(),
        number: $("#num").val(),
        year: $("#year").val(),
        month: $("#month").val(),
        day: $("#day").val(),
        hour: $("#hour").val(),
        minute: $("#minute").val(),
        id: $scope.selected_ph.id,
        description: $("#autocompletefrom").val(),
        pack: $("#pak").val()
      }
    }).then(function (resp) {
      WebService.stopLoading();
      $("#request").css("display", "none");
      $scope.deleteFrom();
      if (resp === 201 || resp === "201") {
        $ionicPopup.alert({
          title: '<p class="text-center color-yellow">' + ("پیام") + '</p>',
          template: '<p class="text-center color-gery">' + ("در حال حاضر یک درخواست ثبت کرده اید") + '</p>'
        });
        return;
      }
      $scope.finalCost = $scope.selected_ph.price;
      $scope.finalPay = false;
      $ionicModal.fromTemplateUrl('templates/deliver-type.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.modal.payment = modal;
        modal.show();
      });
    }, function (err) {
      WebService.stopLoading();
      WebService.myErrorHandler(err, false);
    });
  };
  $scope.delivery;
  var selected = false;
  $scope.deliveryChanged = function () {
    selected = true;
    if ($("#delivery").val() === "1") {
      $scope.finalCost = $scope.selected_ph.price + 10000;
    } else {
      $scope.finalCost = $scope.selected_ph.price + 20000;
    }
  };
  $scope.goToBank = function () {
    if (!$scope.finalPay && !selected) {
      $cordovaToast.showShortBottom('لطفا یکی از روش های تحویل را انتخاب کنید');
      return;
    }
    selected = false;
    $scope.modal.payment.hide();
    $scope.buy();
    if ($scope.finalPay) {
      $ionicModal.fromTemplateUrl('templates/rate.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.rate = modal;
        modal.show();
      });
    }
  };
  $scope.enableBox = true;

  $scope.cancelTrip = function () {
    resetAllThingsWithoutApply();
    $ionicLoading.hide();
    $http.defaults.headers.common.Authorization = $rootScope.token;
    $http({
      method: "POST",
      url: "https://spot.cfapps.io/api/1/rejectUser",
      data: uid
    }).then(function (resp) {
    }, function (err) {
      WebService.myErrorHandler(err, false);
    });
  };
  var uid;
  $scope.book = function () {
    $ionicLoading.show({
      template: '<div><ion-spinner icon="lines"></ion-spinner></div>',
      showBackdrop: true,
      hideOnStateChange: false
    });
    var data;
    if ($scope.Trip_now) {
      data = {
        slat: $scope.start_box.lat,
        slng: $scope.start_box.lng,
        dlat: $scope.end_box.lat,
        dlng: $scope.end_box.lng,
        source: $scope.fromAddress,
        destination: $scope.toAddress,
        cost: $scope.selected_cab.cost,
        description: $("#moreInfo").val()
      };
      $http.defaults.headers.common.Authorization = $rootScope.token;
      $http({
        method: "POST",
        url: "https://spot.cfapps.io/api/1/confirmRequest",
        data: data
      }).then(function (resp) {
        uid = resp.data;
        $ionicLoading.hide();
        $ionicLoading.show({
          template: '<div><ion-spinner icon="lines"></ion-spinner></div>' +
          '<div>درحال انتخاب راننده</div>' +
          '<button id="upperText" onclick="cancelTrip()" style="width: 60px;height:20px;border-radius: 10px;background-color: yellow ' +
          'class="button button-fab expanded button-energized-900">لغو</button>',
          showBackdrop: true,
          hideOnStateChange: false
        });
      }, function (err) {
        $ionicLoading.hide();
        WebService.myErrorHandler(err, false);
      });
    } else {
      data = {
        slat: $scope.start_box.lat,
        slng: $scope.start_box.lng,
        dlat: $scope.end_box.lat,
        dlng: $scope.end_box.lng,
        source: $scope.fromAddress,
        destination: $scope.toAddress,
        cost: $scope.selected_cab.cost,
        year: $scope.date_data.Trip_Date.getFullYear(),
        month: $scope.date_data.Trip_Date.getMonth(),
        day: $scope.date_data.Trip_Date.getDate(),
        hour: $scope.date_data.Trip_Date.getHours(),
        minute: $scope.date_data.Trip_Date.getMinutes()
      };
      $http.defaults.headers.common.Authorization = $rootScope.token;
      $http({
        method: "POST",
        url: "https://spot.cfapps.io/api/1/confirmReserve",
        data: data
      }).then(function (resp) {
      }, function (err) {
        WebService.myErrorHandler(err, false);
      });
    }
    animateMyPop();
  };
  $scope.cancel = function () {
    animateMyPop();
  };
  $scope.clicked_item = function (index) {
    // $window.alert(item);
    $("#tab-hide").css("display", "block");
    $("#request").css("display", "block");
    $scope.active_cab = index;
    animate_tab();
    $scope.selected_ph = $scope.ph[index];
  };

  $scope.disableTapTo = function () {
    container = document.getElementsByClassName('pac-container');
    // disable ionic data tab
    angular.element(container).attr('data-tap-disabled', 'true');
    // leave input field if google-address-entry is selected
    angular.element(container).on("click", function () {
      document.getElementById('autocompleteto').blur();
    });
  };

  $scope.disableTapFrom = function () {
    document.getElementById('autocompletefrom').value = "";
    container = document.getElementsByClassName('pac-container');
    // disable ionic data tab
    angular.element(container).attr('data-tap-disabled', 'true');
    // leave input field if google-address-entry is selected
    angular.element(container).on("click", function () {
      document.getElementById('autocompletefrom').blur();
    });
  };
  $scope.buy = function () {
    WebService.startLoading();
    var url = "https://spot.cfapps.io/api/1/factor";
    var takhfif = "1";
    if ($("#takhfif").val())
      takhfif = $("#takhfif").val();
    $http.post(url, $scope.finalCost + "," + $rootScope.username + "," + $scope.selected_ph.id + "," + takhfif + "," + $("#delivery").val()).success(function (data, status, headers, config) {
      WebService.stopLoading();
      if (!data || data === "") {
        $ionicPopup.alert({
          title: '<p class="text-center color-yellow">' + ("پیام") + '</p>',
          template: '<p class="text-center color-gery">' + ("کد تخفیف اشتباه می باشد") + '</p>'
        });
        return;
      }
      window.open(
        "http://dagala.ir/bank.html?res=" + data + "&amount=" + parseInt($scope.finalCost),
        "_system",
        "hidden=no,location=no,clearsessioncache=yes,clearcache=yes"
      );
    }).catch(function (err) {
      WebService.stopLoading();
      WebService.handleError(err);
    });
  }
});
App.controller('photographerCtrl', function ($rootScope, $state, $scope, $q, $cordovaToast, $http, $ionicLoading, $compile, $ionicModal, $window, $timeout, $ionicPopup, landInit, WebService, $interval, $cordovaNativeAudio, $cordovaVibration) {



  /* Funtion For set Map
   =========================================================== */

  function set_map() {
    // Create an array of styles.
    var styles = landInit.mapStyles();

    // Create a new StyledMapType object, passing it the array of styles,
    var styledMap = new google.maps.StyledMapType(styles,
      {name: "Styled Map"});
    var myLatlng = new google.maps.LatLng(35.705097, 51.385516);
    var mapOptions = {
      center: myLatlng,
      zoom: 16,
      disableDefaultUI: true,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var map = new google.maps.Map(document.getElementById("map"),
      mapOptions);
    // map.mapTypes.set('map_style', styledMap);
    // map.setMapTypeId('map_style');
    $rootScope.map = map;
    $rootScope.init_status = true;
    $ionicLoading.hide();
    var input = document.getElementById('autocompletefrom');
    var options = {
      componentRestrictions: {country: "ir"}
    };
    var autocomplete = new google.maps.places.Autocomplete(input, options);
    var container = $(".pac-container");
    if (container.length > 1)
      container[0].remove();
    autocomplete.bindTo('bounds', map);
    if (input)
      input.style.display = "block";
    autocomplete.addListener('place_changed', function () {
      var place = autocomplete.getPlace();
      if (!place.geometry) {
        return;
      }
      if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
      } else {
        map.setCenter(place.geometry.location);
      }
      map.setZoom(16);
    });
  }


  /* Function For Get place from LatLng
   ==================================================*/
  function codeLatLng(lat, lng) {
    geocoder = new google.maps.Geocoder();
    var latlng = new google.maps.LatLng(lat, lng);
    geocoder.geocode({'latLng': latlng}, function (results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        if (results[1]) {
          $rootScope.$apply(function () {
            $rootScope.Location = results[0].formatted_address;
          });
          $rootScope.current_box = angular.copy($rootScope.start_box);
        } else {
          //alert("No results found");
          // $rootScope.Location = "You are here";

        }
      } else {
        // $rootScope.Location = "You are here";

        //alert("Geocoder failed due to: " + status);
      }
    });
  }

  var lat;
  var lng;
  var marker;

  $rootScope.getCurrentLocation = function () {
    if (!$rootScope.map) {
      return;
    }
    var image = 'img/icons/google_marker.png';
    navigator.geolocation.getCurrentPosition(function (pos) {
      //console.log(pos);
      //alert(JSON.stringify(pos));
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
      var myLatlng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
      codeLatLng(pos.coords.latitude, pos.coords.longitude);
      if (marker)
        marker.setMap(null);
      $rootScope.map.setCenter(myLatlng);
      $ionicLoading.hide();
      prepareSocket();
    }, function (error) {
      $ionicPopup.alert({
        title: '<p class="text-center color-yellow">' + ("پیام") + '</p>',
        template: '<p class="text-center color-gery">' + ("لطفا موقعیت جغرافیایی دستگاه خود را روشن کنید") + '</p>'
      });
      var myLatlng = new google.maps.LatLng(35.796844, 51.453692);
      codeLatLng(pos.coords.latitude, pos.coords.longitude);
      if (marker)
        marker.setMap(null);
      $rootScope.map.setCenter(myLatlng);
      $ionicLoading.hide();
      prepareSocket();
    });
  };
  function prepareSocket() {
    $rootScope.socket = new WebSocket("wss://127.0.0.1:8080:4443/photgraphHandler");
    $rootScope.interval;
    $rootScope.socket.onopen = function () {
      if (!$rootScope.userid) {
        var db = openDatabase('mydb', '1.0', 'Test DB', 1024 * 1024);
        db.transaction(function (tx) {
          tx.executeSql('SELECT d.log FROM ANIJUU d WHERE d.name="userid"', [], function (tx, results) {
            var len = results.rows.length, i, result = '';
            if (!results.rows || results.rows.length == 0) {
              result = null;
            } else {
              result = results.rows.item(0).log;
            }
            setUserId(result)
          }, null);
        });
        var setUserId = function (result) {
          if (!result) {
            $state.go("landing")
          } else {
            $rootScope.userid = result;
            $rootScope.interval = $interval(function () {
              $rootScope.socket.send("mylocation," + $rootScope.userid + "," + lat + "," + lng)
            }, 1000);
          }
        };
      } else {
        $rootScope.interval = $interval(function () {
          $rootScope.socket.send("mylocation," + $rootScope.userid + "," + lat + "," + lng)
        }, 1000);
      }
    };
    $rootScope.socket.onmessage = function (msg) {
      var data = JSON.parse(msg.data);
      switch (data.command) {
        case "request":
          $scope.paid = false;
          if ($rootScope.startMarker) {
            $rootScope.startMarker.setMap(null);
            $rootScope.endMarker.setMap(null);
            $rootScope.ren.setMap(null);
          }
          $rootScope.$apply(function () {
            $rootScope.tripInfo = data.tripInfo;
            $rootScope.pop_status = 1;
          });
          var start = new google.maps.LatLng(data.tripInfo.slat, data.tripInfo.slng);
          var pinIcon = new google.maps.MarkerImage(
            startImage,
            null,
            null,
            null,
            new google.maps.Size(60, 60)
          );
          $rootScope.startMarker = new google.maps.Marker({
            position: start,
            map: $rootScope.map,
            title: '',
            icon: pinIcon
          });
          var end = new google.maps.LatLng(data.tripInfo.dlat, data.tripInfo.dlng);
          var pinIcon2 = new google.maps.MarkerImage(
            endImage,
            null,
            null,
            null,
            new google.maps.Size(60, 60)
          );
          $rootScope.endMarker = new google.maps.Marker({
            position: end,
            map: $rootScope.map,
            title: '',
            icon: pinIcon2
          });
          bound.extend(start);
          bound.extend(end);
          $rootScope.map.fitBounds(bound);
          animateMyPop();
          $rootScope.ren = new google.maps.DirectionsRenderer({
            'draggable': false,
            suppressMarkers: true
          });
          $rootScope.ren.setMap($rootScope.map);
          var ser = new google.maps.DirectionsService();
          ser.route({
            'origin': $rootScope.startMarker.getPosition(),
            'destination': $rootScope.endMarker.getPosition(),
            'travelMode': google.maps.DirectionsTravelMode.DRIVING
          }, function (res, sts) {
            if (sts == google.maps.DirectionsStatus.OK) {
              $rootScope.ren.setDirections(res);
              edame(data);
            } else {
              edame(data);
            }
          });

          break;
        case "rejectuser":
          nextElementAfterRemove($rootScope.active_cab);
          $rootScope.trips.splice($rootScope.active_cab, 1);
          $rootScope.$apply();
          break;
        case "paid":
          $scope.paid = true;
          break;
      }
    };
  }

  var startImage = 'img/source.png';
  var endImage = 'img/destination.png';
  $rootScope.pop_status = 0;
  $rootScope.startMarker;
  $rootScope.endMarker;
  $rootScope.ren;
  var bound;
  $rootScope.trips = [];

  function initialVars() {
    bound = new google.maps.LatLngBounds(null);
  }

  function nextElementAfterRemove(index) {
    if ($rootScope.trips.length == 1) {
      $rootScope.startMarker.setVisible(false);
      $rootScope.endMarker.setVisible(false);
      $rootScope.ren.setMap(null);
    } else if ($rootScope.trips.length == index + 1) {
      $rootScope.clicked_item(index - 1);
    } else {
      $rootScope.clicked_item(index + 1);
    }
  }

  function edame(data) {
    $rootScope.tripInfo.state = "request";
    var trip = {
      tripInfo: data.tripInfo,
      start: $rootScope.startMarker,
      end: $rootScope.endMarker,
      ren: $rootScope.ren
    };
    $rootScope.trips.push(trip);

    $cordovaNativeAudio
      .preloadSimple('migmig', 'audio/migmig.mp3')

      .then(function (msg) {
        console.log(msg);
      }, function (error) {
        console.log(error);
      });
    $cordovaNativeAudio.play("migmig");
    $cordovaVibration.vibrate(1000);
  }

  $scope.$on('ngRepeatFinished', function (ngRepeatFinishedEvent) {
    $rootScope.clicked_item($rootScope.indexOfNg);
  });
  $rootScope.clicked_item = function (index) {
    // $window.alert(item);
    $rootScope.active_cab = index;
    animate_tab();
    $rootScope.startMarker.setVisible(false);
    $rootScope.endMarker.setVisible(false);
    $rootScope.ren.setMap(null);
    $rootScope.tripInfo = $rootScope.trips[index].tripInfo;
    $rootScope.startMarker = $rootScope.trips[index].start;
    $rootScope.endMarker = $rootScope.trips[index].end;
    $rootScope.ren = $rootScope.trips[index].ren;
    $rootScope.ren.setMap($rootScope.map);
    $rootScope.startMarker.setVisible(true);
    $rootScope.startMarker.setMap($rootScope.map);
    $rootScope.endMarker.setVisible(true);
    $rootScope.endMarker.setMap($rootScope.map);
    var element = $("#my-pop");
    switch ($rootScope.tripInfo.state) {
      case "request":
        $rootScope.pop_status = 1;
        if (!element.hasClass("my-active")) {
          element.addClass("my-active")
        }
        break;
      case "accept":
        $rootScope.pop_status = 2;
        if (element.hasClass("my-active")) {
          element.removeClass("my-active")
        }
        break;
      case "rejectBeforeAccept":
        resetAllThings();
        if (element.hasClass("my-active")) {
          element.removeClass("my-active")
        }
        break;
      case "arrived":
        $rootScope.pop_status = 3;
        if (element.hasClass("my-active")) {
          element.removeClass("my-active")
        }
        break;
      case "cancelAfterAccept":
        resetAllThings();
        if (element.hasClass("my-active")) {
          element.removeClass("my-active")
        }
        break;
      case "endOfTrip":
        nextElementAfterRemove(index);
        $rootScope.trips.splice(index, 1);
        $rootScope.ren.setMap(null);
        resetAllThings();
        if (element.hasClass("my-active")) {
          element.removeClass("my-active")
        }
        break;
    }
  };
  function animate_tab() {
    $('#tab-hide').addClass('hidden');
    $timeout(function () {
      $('#tab-hide').removeClass('hidden');
    }, 300);
  }

  var available = false;
  var oldUid = null;
  $rootScope.availableOrNot = function () {
    $http.defaults.headers.common.Authorization = $rootScope.token;
    $http({
      method: "POST",
      url: "https://spot.cfapps.io/api/1/changeStatus"
    }).then(function (resp) {
    }, function (err) {
    });
    if (available) {
      available = false;
      $interval.cancel($rootScope.interval);
      $interval.cancel($rootScope.interval2);
      $interval.cancel($rootScope.interval3);
    } else {
      available = true;
      $rootScope.getCurrentLocation();
      $rootScope.interval = $interval(function () {
        $rootScope.socket.send("mylocation," + $rootScope.userid + "," + lat + "," + lng)
      }, 3600000);
      $rootScope.interval2 = $interval(function () {
        $http.defaults.headers.common.Authorization = $rootScope.token;
        $http({
          method: "POST",
          url: "https://spot.cfapps.io/api/1/current"
        }).then(function (resp) {
          if (resp.data.uid !== oldUid) {
            $rootScope.interval3 = $interval(function () {
              $rootScope.socket.send("delivery," + $rootScope.userid + "," + lat + "," + lng + "," + resp.data.clientId + "," + $rootScope.name + "," + $rootScope.tel)
            }, 15000);
            $scope.tripInfo = resp.data;
            oldUid = resp.data.uid;
            var start = new google.maps.LatLng(lat, lng);
            var pinIcon = new google.maps.MarkerImage(
              startImage,
              null,
              null,
              null,
              new google.maps.Size(60, 60)
            );
            $rootScope.startMarker = new google.maps.Marker({
              position: start,
              map: $rootScope.map,
              title: '',
              icon: pinIcon
            });
            var end = new google.maps.LatLng(resp.data.dlat, resp.data.dlng);
            var pinIcon2 = new google.maps.MarkerImage(
              endImage,
              null,
              null,
              null,
              new google.maps.Size(60, 60)
            );
            $rootScope.endMarker = new google.maps.Marker({
              position: end,
              map: $rootScope.map,
              title: '',
              icon: pinIcon2
            });
            initialVars();
            bound.extend(start);
            bound.extend(end);
            $rootScope.map.fitBounds(bound);
            animateMyPop();
            $rootScope.ren = new google.maps.DirectionsRenderer({
              'draggable': false,
              suppressMarkers: true
            });
            $rootScope.ren.setMap($rootScope.map);
            var ser = new google.maps.DirectionsService();
            ser.route({
              'origin': $rootScope.startMarker.getPosition(),
              'destination': $rootScope.endMarker.getPosition(),
              'travelMode': google.maps.DirectionsTravelMode.DRIVING
            }, function (res, sts) {
              if (sts == google.maps.DirectionsStatus.OK) {
                $rootScope.ren.setDirections(res);
                // edame(data);
              } else {
                // edame(data);
              }
            });
          }
        }, function (err) {
          WebService.stopLoading();
        });
      }, 15000);
    }
  };
  $rootScope.CallNumber = function () {
    window.plugins.CallNumber.callNumber(function () {
    }, function () {
    }, $rootScope.tripInfo.mobile)
  };
  $rootScope.arrived = function () {
    WebService.startLoading();
    $rootScope.tripInfo.state = "arrived";
    $rootScope.pop_status = 3;
    $http.defaults.headers.common.Authorization = $rootScope.token;
    $http({
      method: "POST",
      url: "https://spot.cfapps.io/api/1/arrived",
      data: $rootScope.tripInfo.uid
    }).then(function (resp) {
      WebService.stopLoading();
    }, function (err) {
      WebService.stopLoading();
      WebService.myErrorHandler(err, false);
    });
  };
  $rootScope.accept = function () {
    WebService.startLoading();
    $rootScope.tripInfo.state = "accept";
    animateMyPop();
    $http.defaults.headers.common.Authorization = $rootScope.token;
    $http({
      method: "POST",
      url: "https://spot.cfapps.io/api/1/approvedDriver",
      data: $rootScope.tripInfo.uid
    }).then(function (resp) {
      $rootScope.pop_status = 2;
      $interval.cancel($rootScope.interval);
      if (!lat)
        $rootScope.getCurrentLocation();
      $rootScope.interval = $interval(function () {
        $rootScope.socket.send("delivery," + $rootScope.userid + "," + lat + "," + lng + "," + $rootScope.tripInfo.userID);
      }, 1000);
      WebService.stopLoading();
    }, function (err) {
      if (err.status == 404) {
        nextElementAfterRemove($rootScope.active_cab);
        $rootScope.trips.splice($rootScope.active_cab, 1);
        $cordovaToast.showShortBottom('این سفر توسط مسافر لغو شد');
      } else {
        WebService.myErrorHandler(err, false);
      }
      WebService.stopLoading();
    });
  };
  $rootScope.rejectBeforeAccept = function () {
    WebService.startLoading();
    $rootScope.tripInfo.state = "rejectBeforeAccept";
    resetAllThings();
    animateMyPop();
    $http.defaults.headers.common.Authorization = $rootScope.token;
    $http({
      method: "POST",
      url: "https://spot.cfapps.io/api/1/rejectBeforeDriver",
      data: $rootScope.tripInfo.uid
    }).then(function (resp) {
      WebService.stopLoading();
    }, function (err) {
      WebService.stopLoading();
      WebService.myErrorHandler(err, false);
    });
  };
  $rootScope.cancelAfterAccept = function () {
    WebService.startLoading();
    $rootScope.tripInfo.state = "cancelAfterAccept";
    resetAllThings();
    $http.defaults.headers.common.Authorization = $rootScope.token;
    $http({
      method: "POST",
      url: "https://spot.cfapps.io/api/1/rejectAfterDriver",
      data: $rootScope.tripInfo.uid
    }).then(function (resp) {
      WebService.stopLoading();
    }, function (err) {
      WebService.stopLoading();
      WebService.myErrorHandler(err, false);
    });
  };
  function resetAllThings() {
    if ($rootScope.startMarker) {
      $rootScope.startMarker.setMap(null);
      $rootScope.endMarker.setMap(null);
    }
    $rootScope.pop_status = 0;
    $interval.cancel($rootScope.interval);
    $rootScope.getCurrentLocation();
    $rootScope.interval = $interval(function () {
      $rootScope.socket.send("mylocation," + $rootScope.userid + "," + lat + "," + lng)
    }, 60000);
  }

  $rootScope.endOfTrip = function () {
    WebService.startLoading();
    $rootScope.tripInfo.state = "endOfTrip";
    $rootScope.ren.setMap(null);
    nextElementAfterRemove($rootScope.active_cab);
    $rootScope.trips.splice($rootScope.active_cab, 1);
    resetAllThings();
    $http.defaults.headers.common.Authorization = $rootScope.token;
    $http({
      method: "POST",
      url: "https://spot.cfapps.io/api/1/endOfTrip",
      data: $rootScope.tripInfo.uid
    }).then(function (resp) {
      WebService.stopLoading();
    }, function (err) {
      WebService.stopLoading();
      WebService.myErrorHandler(err, false);
    });
  };
  if ($rootScope.init_status === undefined) {
    $.getScript("https://maps.googleapis.com/maps/api/js?key=AIzaSyBksdkjWFIfdMS_IhY8sEit6r9IPrPq-lA&sensor=true&libraries=places", function (data, textStatus, jqxhr) {
      if (typeof google === 'object' && typeof google.maps === 'object') {
        var s = document.createElement("script");
        s.type = "text/javascript";
        s.data = data;
        $("head").append(s);
        initialMainPage();
      } else {
        $cordovaToast.showShortBottom('لطفا اتصال اینترنت خود را بررسی کنید');
      }
    });
  }
  function initialMainPage() {
    set_map();
    initialVars();
    $rootScope.getCurrentLocation();
    google.maps.event.trigger($rootScope.map, 'resize');
  }

  document.addEventListener("online", onOnline, false);
  function onOnline() {
    if ($rootScope.init_status === undefined) {
      initialMainPage();
    }
  }

  function animateMyPop() {
    $('#my-pop').toggleClass('my-active');
  }
});

App.service('serv', function ($rootScope) {

  this.set_trip_tab = function () {

    $rootScope.myTrip_menu_selected = 0;

  };


});
function cancelTrip() {
  var scope = angular.element(
    document.getElementById("landingContent")).scope();
  scope.$apply(function () {
    scope.cancelTrip();
  });
}

function limitSize(e, id, size) {
  var keys = [8, 9, 16, 17, 18, 19, 20, 27, 33, 34, 35, 36, 37, 38, 39, 40, 45, 46, 144, 145];
  if ($.inArray(e.keyCode, keys) == -1) {
    if ($("#" + id).val().length >= size) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
}
