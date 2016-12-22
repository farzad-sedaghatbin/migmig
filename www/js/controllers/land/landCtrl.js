App.controller('landCtrl', function ($scope, $rootScope, $q, $http, $ionicLoading, $compile, $ionicModal, $window, $timeout, $ionicPopup, landInit, WebService, $filter) {



  /* Funtion For set Map
   =========================================================== */

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
      disableDefaultUI: true,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var map = new google.maps.Map(document.getElementById("map"),
      mapOptions);
    map.mapTypes.set('map_style', styledMap);
    map.setMapTypeId('map_style');
    $scope.map = map;
    $scope.init_status = true;
  }


  /* Function For Get place from LatLng
   ==================================================*/
  function codeLatLng(lat, lng) {
    $scope.loading = $ionicLoading.show({
      content: 'Getting current location...',
      showBackdrop: false
    });
    geocoder = new google.maps.Geocoder();

    var latlng = new google.maps.LatLng(lat, lng);
    geocoder.geocode({'latLng': latlng}, function (results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        // console.log(results)
        if (results[1]) {

          $scope.$apply(function () {
            $scope.Location = results[0].formatted_address;
            $scope.start_box.location = results[0].formatted_address;
          });

          $scope.start_box_copy = angular.copy($scope.start_box);
          $scope.current_box = angular.copy($scope.start_box);

        } else {
          //alert("No results found");
          // $scope.Location = "You are here";

        }
      } else {
        // $scope.Location = "You are here";

        //alert("Geocoder failed due to: " + status);
      }
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
      var marker = new google.maps.Marker({
        position: myLatlng,
        map: $scope.map,
        title: '',
        icon: image
      });
      $scope.map.setCenter(myLatlng);
      $ionicLoading.hide();
    }, function (error) {
      alert('Unable to get location: ' + error.message);
    });
  };
  $scope.newTrip = function () {
    resetAllThingsWithoutApply();
    if ($("#my-pop").hasClass("my-active")){
      animateMyPop();
    }
  };
  $scope.deleteFrom = function () {
    if (numOfClick == 1) {
      numOfClick = 0;
    } else if (numOfClick == 2) {
      numOfClick = 3;
    }
    $scope.fromMarker.setMap(null);
    document.getElementById('autocompletefrom').value = "";
  };
  $scope.deleteTo = function () {
    if (numOfClick == 2) {
      numOfClick = 1;
    } else if (numOfClick == 3) {
      numOfClick = 0;
    }
    $scope.toMarker.setMap(null);
    document.getElementById('autocompleteto').value = "";
  };

  var numOfClick = 0;
  var client = new WebSocket("wss://migmig.cfapps.io:4443/myHandler");
  client.onopen = function () {
    client.send("join,1");
  };
  var image = 'img/motor.png';
  var bound = new google.maps.LatLngBounds(null);
  var markers = [];
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
          var marker = new google.maps.Marker({
            position: loc,
            map: $scope.map,
            title: '',
            icon: image
          });
          marker.setVisible(true);
          markers.push(marker);
          bound.extend(loc);
        });
        $scope.map.fitBounds(bound);
        break;
      case "driverinfo":
        $("#footer").css("height","70px");
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
        $ionicLoading.hide();
        delivery.setPosition(new google.maps.LatLng(data.deliveryLocationDTO.lat, data.deliveryLocationDTO.lng));
        delivery.setMap($scope.map);
        delivery.setVisible(true);
        bound.extend(delivery.getPosition());
        $scope.map.fitBounds(bound);
        break;
      case "reject":
        $ionicPopup.alert({
          title: '<p class="text-center color-yellow">' + $filter('langTranslate')("سفر پرید", $rootScope.appConvertedLang['FAILED']) + '</p>',
          template: '<p class="text-center color-gery">' + $filter('langTranslate')("سفر توسط راننده لغو شد.لطفا مجددا اقدام نمایید.", $rootScope.appConvertedLang['Enter_pickup_location']) + '</p>'
        });
        resetAllThings();
        break;
      case "arrived":
        // $cordovaNativeAudio.play("driver");
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
    $("#footer").css("height","44px");
  }
  var fromInfowindow = new google.maps.InfoWindow();
  var toInfowindow = new google.maps.InfoWindow();
  function setAutocompleteBoxes(data) {
    var from_el = document.getElementById('autocompletefrom');
    var to_el = document.getElementById('autocompleteto');
    var startImage = 'img/source.png';
    var endImage = 'img/destination.png';
    $scope.map.addListener("click", function (event) {
      if (numOfClick == 2) {
        alert("مبدا و مقصد قبلا انتخاب شده اند")
      } else {
        if (numOfClick == 0 || numOfClick == 3) {
          //reset bounds
          bound = new google.maps.LatLngBounds(null);
          bound.extend(event.latLng);
          if (numOfClick == 3) {
            bound.extend($scope.toMarker.getPosition());
          }
          //change states
          if (numOfClick == 0) {
            numOfClick = 1;
          } else {
            numOfClick = 2;
          }
          $scope.fromMarker = new google.maps.Marker({
            map: $scope.map,
            icon: startImage
          });
          $scope.fromMarker.setPosition(event.latLng);
          $scope.fromMarker.setVisible(true);
          var contentString = '<div ng-click="deleteFrom()" class="myText">لغو مبدا</div>';
          var compiled = $compile(contentString)($scope);
          fromInfowindow.setContent(compiled[0]);
          fromInfowindow.open($scope.map, $scope.fromMarker);
          $scope.fromMarker.addListener('click', function () {
            toInfowindow.close();
            fromInfowindow.open($scope.map, $scope.fromMarker);
          });
          $scope.$apply(function () {
            $scope.start_box.location = '';
            $scope.start_box.lat = event.latLng.lat();
            $scope.start_box.lng = event.latLng.lng();
          });
          $http({
            method: "POST",
            url: "http://maps.googleapis.com/maps/api/geocode/json?latlng=" + event.latLng.lat() + "," + event.latLng.lng() + "&sensor=true&language=fa"
          }).then(function (resp) {
            from_el.value = resp.data.results[1].formatted_address;
            $scope.fromAddress = resp.data.results[1].formatted_address;
          }, function (err) {
            alert("error");
          });
          $scope.map.fitBounds(bound);
          client.send("aroundme,1," + $scope.start_box.lat + "," + $scope.start_box.lng);
        } else if (numOfClick == 1) {
          numOfClick = 2;
          bound = new google.maps.LatLngBounds(null);
          bound.extend(event.latLng);
          bound.extend($scope.fromMarker.getPosition());
          $scope.toMarker = new google.maps.Marker({
            map: $scope.map,
            icon: endImage
          });
          $scope.toMarker.setPosition(event.latLng);
          $scope.toMarker.setVisible(true);
          var contentString = '<div ng-click="deleteTo()" class="myText">لغو مقصد</div>';
          var compiled = $compile(contentString)($scope);
          toInfowindow.setContent(compiled[0]);
          toInfowindow.open($scope.map, $scope.toMarker);
          $scope.toMarker.addListener('click', function () {
            fromInfowindow.close();
            toInfowindow.open($scope.map, $scope.toMarker);
          });
          $scope.$apply(function () {
            $scope.end_box.location = '';
            $scope.end_box.lat = event.latLng.lat();
            $scope.end_box.lng = event.latLng.lng();
          });
          $http({
            method: "POST",
            url: "http://maps.googleapis.com/maps/api/geocode/json?latlng=" + event.latLng.lat() + "," + event.latLng.lng() + "&sensor=true&language=fa"
          }).then(function (resp) {
            to_el.value = resp.data.results[1].formatted_address;
            $scope.toAddress = resp.data.results[1].formatted_address;
          }, function (err) {
            alert("error");
          });
          $scope.map.fitBounds(bound);
          tripCalculations();
        }
      }
    });
    var options = {
      // componentRestrictions: {country: "in"}
      componentRestrictions: {country: "ir"}
    };
    $scope.from = new google.maps.places.Autocomplete(from_el, options);
    google.maps.event.addListener($scope.from, 'place_changed', function () {
      if (numOfClick == 0 || numOfClick == 1) {
        numOfClick = 1;
      } else {
        numOfClick = 2;
      }
      toInfowindow.close();
      if ($scope.fromMarker) {
        $scope.fromMarker.setMap(null);
      }
      bound = new google.maps.LatLngBounds(null);
      bound.extend($scope.from.getPlace().geometry.location);
      if (numOfClick == 3 || numOfClick == 2) {
        bound.extend($scope.toMarker.getPosition());
      }
      $scope.map.fitBounds(bound);
      $scope.fromMarker = new google.maps.Marker({
        map: $scope.map,
        anchorPoint: new google.maps.Point(0, -29)
      });
      $scope.fromMarker.setPosition($scope.from.getPlace().geometry.location);
      $scope.fromMarker.setVisible(true);
      $scope.fromMarker.addListener('click', function () {
        toInfowindow.close();
        fromInfowindow.open($scope.map, $scope.fromMarker);
      });
      var contentString = '<div ng-click="deleteFrom()" class="myText">لغو مبدا</div>';
      var compiled = $compile(contentString)($scope);
      fromInfowindow.setContent(compiled[0]);
      fromInfowindow.open($scope.map, $scope.fromMarker);
      $scope.$apply(function () {
        $scope.start_box.location = $scope.from.getPlace().formatted_address;
        $scope.start_box.lat = $scope.from.getPlace().geometry.location.lat();
        $scope.start_box.lng = $scope.from.getPlace().geometry.location.lng();
      });
      client.send("aroundme,1," + $scope.start_box.lat + "," + $scope.start_box.lng);
    });

    $scope.to = new google.maps.places.Autocomplete(to_el, options);
    google.maps.event.addListener($scope.to, 'place_changed', function () {
      if (numOfClick == 0) {
        numOfClick = 3;
      } else if (numOfClick == 1) {
        numOfClick = 2;
      }
      fromInfowindow.close();
      if ($scope.toMarker) {
        $scope.toMarker.setMap(null);
      }
      bound = new google.maps.LatLngBounds(null);
      if (numOfClick == 1 || numOfClick == 2) {
        bound.extend($scope.fromMarker.getPosition());
      }
      bound.extend($scope.to.getPlace().geometry.location);
      $scope.map.fitBounds(bound);
      $scope.toMarker = new google.maps.Marker({
        map: $scope.map,
        anchorPoint: new google.maps.Point(0, -29)
      });
      $scope.toMarker.addListener('click', function () {
        fromInfowindow.close();
        toInfowindow.open($scope.map, $scope.toMarker);
      });
      $scope.toMarker.setPosition($scope.to.getPlace().geometry.location);
      $scope.toMarker.setVisible(true);
      $scope.$apply(function () {
        $scope.end_box.location = $scope.to.getPlace().formatted_address;
        $scope.end_box.lat = $scope.to.getPlace().geometry.location.lat();
        $scope.end_box.lng = $scope.to.getPlace().geometry.location.lng();
      });
      var contentString = '<div ng-click="deleteTo()" class="myText">لغو مقصد</div>';
      var compiled = $compile(contentString)($scope);
      toInfowindow.setContent(compiled[0]);
      toInfowindow.open($scope.map, $scope.toMarker);
      tripCalculations();
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

    var promise = WebService.send_data(link, post_data);

    promise.then(function (data) {
      //alert(JSON.stringify(data,null,4));
      setAutocompleteBoxes(data);

    });
  }
  $scope.CallNumber = function(number){
    window.plugins.CallNumber.callNumber(function(){
    }, function(){
    }, number)
  };
  $scope.$on("$ionicView.enter", function (scopes, states) {
    google.maps.event.trigger($scope.map, 'resize');
  });

  function animateMyPop() {
    $('#my-pop').toggleClass('my-active');
    $scope.Trip_Date = null;
  }

  /* RIDE NOW
   ======================================*/
  $scope.ride = function (time) {
    if ($scope.start_box.lat == null) {
      var alertPopup = $ionicPopup.alert({
        title: '<p class="text-center color-yellow">' + $filter('langTranslate')("FAILED", $rootScope.appConvertedLang['FAILED']) + '</p>',
        template: '<p class="text-center color-gery">' + $filter('langTranslate')("Enter pickup location", $rootScope.appConvertedLang['Enter_pickup_location']) + '</p>'
      });
      alertPopup.then(function (res) {
        console.log('');
      });
    } else if ($scope.end_box.lat == null) {
      alertPopup = $ionicPopup.alert({
        title: '<p class="text-center color-yellow">' + $filter('langTranslate')("FAILED", $rootScope.appConvertedLang['FAILED']) + '</p>',
        template: '<p class="text-center color-gery">' + $filter('langTranslate')("Enter Drop location", $rootScope.appConvertedLang['Enter_Drop_location']) + '</p>'
      });
      alertPopup.then(function (res) {

      });
    } else {
      if (time == 'later') {
        $scope.Trip_now = false;
        $scope.past_date = false;
        //$scope.book_date = $scope.Trip_Date;
        $scope.date_data = {};
        //if(appConvertedLang['Enter_date_and_time']!='')
        min_date = new Date().toISOString();
        var myPopup = $ionicPopup.show({
          template: '<input   class="color-yellow" placeholder="Date:" style=" background-color: #3e3e3e; padding-left:20px;width:100%; line-Height: 20px" ng-model="date_data.Trip_Date" min=' + min_date + ' type="datetime-local">' +
          '<div class="error  text-center" ng-show="past_date==true">Invalid Date and Time </div>',
          title: '<p class="color-yellow">' + $filter('langTranslate')("Enter date and time", $rootScope.appConvertedLang['Enter_date_and_time']) + '</p>',
          scope: $scope,
          buttons: [
            {
              text: $filter('langTranslate')("Cancel", $rootScope.appConvertedLang['Cancel']),
              onTap: function (e) {
                return false;
              }
            },
            {
              text: $filter('langTranslate')("Save", $rootScope.appConvertedLang['Save']),
              onTap: function (e) {
                //alert($scope.date_data.Trip_Date);
                if ($scope.date_data.Trip_Date == null) {
                  //don't allow the user to close unless he enters wifi password
                  $scope.past_date = true;
                  e.preventDefault();
                } else {
                  return $scope.date_data.Trip_Date;
                }
              }
            }
          ]
        });
        myPopup.then(function (res) {
          if (res != false) {
            $scope.book_date = res;
            $scope.book();
          }
        });
      }
      else {
        $scope.Trip_now = true;
        $scope.book();
      }
    }
  };
  $scope.enableBox = true;
  function tripCalculations() {
    fromInfowindow.close();
    toInfowindow.close();
    google.maps.event.clearListeners($scope.map, 'click');
    google.maps.event.clearListeners($scope.fromMarker, 'click');
    google.maps.event.clearListeners($scope.toMarker, 'click');
    $scope.enableBox = false;
    $ionicLoading.show();
    $http({
      method: "POST",
      url: "https://migmig.cfapps.io/api/1/calculate",
      data: $scope.start_box.lat + "," + $scope.start_box.lng + "," + $scope.end_box.lat + "," + $scope.end_box.lng
    }).then(function (resp) {
      $ionicLoading.hide();
      $scope.cabs = resp.data;
      $scope.selected_cab = $scope.cabs[0];
      animateMyPop();
    }, function (err) {
      $ionicLoading.hide();
    });
  }

  $scope.cancelTrip = function () {
    resetAllThingsWithoutApply();
    $ionicLoading.hide();
    $http({
      method: "POST",
      url: "https://migmig.cfapps.io/api/1/rejectUser",
      data: uid
    }).then(function (resp) {
    }, function (err) {
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
        cost: $scope.selected_cab.cost
      };
      $http({
        method: "POST",
        url: "https://migmig.cfapps.io/api/1/confirmRequest",
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
      $http({
        method: "POST",
        url: "https://migmig.cfapps.io/api/1/confirmReserve",
        data: data
      }).then(function (resp) {
      }, function (err) {

      });
    }
    animateMyPop();
  };
  $scope.cancel = function () {
    animateMyPop();
  };
  $scope.clicked_item = function (index) {
    // $window.alert(item);
    $scope.active_cab = index;
    animate_tab();
    $scope.selected_cab = $scope.cabs[index];

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
    container = document.getElementsByClassName('pac-container');
    // disable ionic data tab
    angular.element(container).attr('data-tap-disabled', 'true');
    // leave input field if google-address-entry is selected
    angular.element(container).on("click", function () {
      document.getElementById('autocompletefrom').blur();
    });
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

