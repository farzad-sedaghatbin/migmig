
App.controller('myTripCtrl', function($scope,$rootScope, $ionicLoading, $compile, $ionicModal,$window,$timeout,$state,$http) {

	/* JAVASCRIPT
	===========================*/
	function animate_Trip_item(){
			$('#content-tab-area').addClass('hidden');

			$timeout(function (){
				$('#content-tab-area').removeClass('hidden');
			}, 300);
	 }

	$scope.myTrip_menu = [
												{'name':'سفرهای درحال انجام'},
												{'name':'سفرهای رزرو شده'},
												{'name':'سفرهای کامل شده'}
											 ];
	//$scope.myTrip_menu_selected = 0;
	$scope.Trip_menu_click = function (index){
		if( $rootScope.myTrip_menu_selected != index ){

			$rootScope.myTrip_menu_selected = index;
			if( index == 0 ){
				$rootScope.active_trip = $rootScope.Trips.inProgressTrips;
			}else if( index ==  1 ){
				$rootScope.active_trip = $rootScope.Trips.reservedTrips;
			}else if( index ==  2){
				$rootScope.active_trip = $rootScope.Trips.compeletedTrips;
			}
			animate_Trip_item();
		}
	};
	$scope.show_details = function( index ){
    $http({
      method: "POST",
      url: "https://migmig.cfapps.io/api/1/detail"
    }).then(function (resp) {
      $rootScope.details = resp.data;
      $state.go("app.tripDetials")
    }, function (err) {
    });
	};
  $scope.showFrom = function(){
    $state.go("app.navigation");
  }

});
