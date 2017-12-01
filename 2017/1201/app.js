/* app.js */
var app = angular.module('App', []);

app.controller('AppController', ['$scope', '$http',
  function($scope, $http) {
    $scope.ACCESS_KEY = '<アクセスキーを入力してください>'; // 駅すぱあとWebサービスのアクセスキー。

    // initialize
    $scope.init = function() {
      $scope.stations = [];

      // Leaflet(地図ライブラリ)の初期化。
      $scope.mymap = L.map('mapid', {
        center: [35.68131, 139.767234], // 初期表示では東京駅を地図の中心にしています。
        zoom: 14
      });
      L.control.scale().addTo($scope.mymap);

      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="http://mapbox.com">Mapbox</a>',
        id: 'mapbox.streets'
      }).addTo($scope.mymap);

      // 駅すぱあとWebサービス HTML5インタフェースサンプルの初期化。
      // 駅名入力パーツを初期化する。
      // 参考：https://github.com/EkispertWebService/GUI/wiki/html5_demo_3
      $scope.station_app = new expGuiStation(document.getElementById("station1"));
      $scope.station_app.dispStation();

      $scope.update();
    }

    // 駅名を追加した時の処理。
    $scope.get_station = function() {
      var url = 'http://api.ekispert.jp/v1/json/station?key=' + $scope.ACCESS_KEY;
      url += '&code=' + $scope.station_app.getStationCode();

      // 駅すぱあとWebサービスの駅情報(/station)APIを呼び出す
      $http({
        method: 'GET',
        url:    url
      }).success(function(data, status, headers, config) {
        // 緯度経度の測地系を日本測地系から世界測地系に変換する。
        // (leaflet(地図描画ライブラリ)に渡す緯度経度は世界測地系での指定になるため)
        var base_lati  = data.ResultSet.Point.GeoPoint.lati_d;  // 緯度(日本測地系)
        var base_longi = data.ResultSet.Point.GeoPoint.longi_d; // 経度(日本測地系)

        var wgs_lati  = base_lati  - base_lati * 0.00010695  + base_longi * 0.000017464 + 0.0046017;
        var wgs_longi = base_longi - base_lati * 0.000046038 - base_longi * 0.000083043 + 0.01004;

        var new_station = {
          code: data.ResultSet.Point.Station.code,  // 駅コード
          name: data.ResultSet.Point.Station.Name,  // 駅名
          yomi: data.ResultSet.Point.Station.Yomi,  // よみがな
          prefecture: data.ResultSet.Point.Prefecture.Name,  // 都道府県
          lati:  wgs_lati,  // 緯度(世界測地系)
          longi: wgs_longi, // 経度(日本測地系)
          pin_on_map: false
        };

        $scope.stations.push(new_station); // 駅名の配列に追加する。
      }).error(function(data, status, headers, config) {
        console.log('error. status = ' + status);
      });

      $scope.update();
    }

    // 駅に立てたピンの表示・非表示を切り替える。
    $scope.toggle = function(station) {
      for (var i in $scope.stations) {
        if (station.name == $scope.stations[i].name) {
          $scope.stations[i].pin_on_map = ! $scope.stations[i].pin_on_map;
          break;
        }
      }
      $scope.update();
    }

    // 追加した駅をリストから除去する。
    $scope.remove = function(station) {
      for (var i in $scope.stations) {
        if (station.name == $scope.stations[i].name) {
          $scope.stations.splice(i, 1);
          $scope.update();
          return;
        }
      }
    }

    // 地図の表示を更新する。
    $scope.update = function() {
      for (var i in $scope.markers) {
        $scope.mymap.removeLayer($scope.markers[i]);
      }
      $scope.markers = [];

      for (var i in $scope.stations) {
        if ($scope.stations[i].pin_on_map == false) {
          continue;
        }
        var marker = L.marker([$scope.stations[i].lati, $scope.stations[i].longi]);
        marker.addTo($scope.mymap).bindPopup($scope.stations[i].name).openPopup();
        $scope.markers.push(marker);
      }
    }

    // ダイアログを閉じた時の処理。
    $scope.closeDialog = function() {
      $scope.get_station();
      $('#modal1').modal('hide');
    }

    $scope.init();
  }
]);

