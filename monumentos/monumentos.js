Players = new Meteor.Collection("owut");
// HTMLttpsreport.deny({
//   update: function(userId, docs, fields, modifier){
//     return _.contains(fields, 'score');
//   }
// })
CurrentGame = new Meteor.Collection("currentgame");
CurrentPoints = new Meteor.Collection("points");
HTMLttpsreport = new Meteor.Collection("players");
LatestScores = new Meteor.Collection("recentScores");
// HTMLttpsreport.remove({});
// CurrentGame.remove({});
// CurrentPoints.remove({});
// Players.remove({});
// LatestScores.remove({});

if (Meteor.isClient) {
  Meteor.startup(function () {
    var userid = HTMLttpsreport.insert({username: 'scoobyClone', score: 0});

    var colors = ['#f00','#00f','#0f0','yellow','orange','#f0f','#444','black','brown','pink', '#FF0','#330', '#660', '#66C', '#CC0'];
    var userColor = colors[Math.floor(Math.random()*colors.length)];

    Session.set('id', userid);
    Session.set('color', userColor);

    var markerArray = [];

    Template.worldMap.rendered = function(){
      var map = L.map('map');
      var osmUrl='http://otile3.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png';
      var osm = new L.TileLayer(osmUrl, {minZoom: 2, maxZoom: 2});
      map.setView(new L.LatLng(30, 0),2);
      map.addLayer(osm);

      function onMapClick(e) {
        console.log("You clicked the map at " + e.latlng);
        var targetGeo = CurrentGame.findOne();
        var dist = e.latlng.distanceTo(L.latLng(targetGeo.lat, targetGeo.lon));
        setScore(dist/1000);
        // inserts clicked point into db for other players to see
        CurrentPoints.insert({id: Session.get('id'), point: e.latlng, color: Session.get('color')});

        var pointsFromServer = CurrentPoints.find().fetch();

        for(var i=0; i<pointsFromServer.length; i++) {
          var pointer = pointsFromServer[i];
          var tmpCircle = new L.circle(pointer.point, 500, {color: pointer.color, fillColor: pointer.color, fillOpacity: 0.8});
          markerArray.push(tmpCircle);
          map.addLayer(tmpCircle);
        }


      }
      map.on('click', onMapClick);
      Meteor.setInterval(function(){
        for(i=0;i<markerArray.length;i++) {
          map.removeLayer(markerArray[i]);
        }
      }, 15000);
        //       if(dist/1000<500) {
        //   // Meteor.call('begin_round');
        // }
    };
  });

  var setScore = function(dist){
    var points = Math.ceil(10*(1-(dist/2000)));
    var gameId = CurrentGame.findOne()._id;

    if (points > 0 && Session.get('scoredPositive') !== gameId){
      Session.set('scoredPositive', gameId);
    } else {
      points = Math.floor(points / 20);
    }

    LatestScores.insert({username: Session.get('name'), score: points, timeOfScore: Date.now()});

    Meteor.call('db_info_version', Session.get('id'), points, function(){
      if(points>0) {
        $('.user_score').css('color', '#0f0');
        $('.user_score').animate({ fontSize: '18px' }, 150, function(){
          $('.user_score').animate({ fontSize: '17px' }, 150, function(){
            $('.user_score').css('color', '#000');
          });
        });
      } else {
        $('.user_score').css('color', '#f00');
        $('.user_score').animate({fontSize:'17px'}, 400, function(){
          $('.user_score').css('color', '#000');
        });
      }
    });
    // console.log('dist', dist);
    // console.log('points', points);
  };

  Meteor.setInterval(function(){
    HTMLttpsreport.update({_id:Session.get('id')}, {$set: {lastPlayed: Date.now()}});
  }, 1000*90);

  Template.currentPlace.show = function(){
    return (CurrentGame.findOne()) ? CurrentGame.findOne().name : "Welcome";
  };

  Template.currentUser.user = function(){
    return Session.get('name');
  };

  Template.currentPlayers.players = function(){
    var past30s = Date.now() - 1000*30;
    return HTMLttpsreport.find({lastPlayed: {$gt: past30s }}, {sort: {score:-1, name: 1}});
  };

  Template.player.userRow = function(){
    return Session.equals('id', this._id) ? "user_row" : '';
  };

  Template.player.userScore = function(){
    return Session.equals('id', this._id) ? "user_score" : '';
  };

  Template.latestScores.pointfeed = function(){
    var pastMin = Date.now() - 1000*60;
    return LatestScores.find({timeOfScore: {$gt: pastMin }}, {sort: {timeOfScore: -1}, limit: 5}).fetch();
  };

  Template.currentUser.events = {
    'keypress #enter_user': function (e) {
      if (e.which === 13) {
        inputUsername();
      }
    },
    'click input.add': function(){
      inputUsername();
    }
  };

  var inputUsername = function(){
    var new_player_name = document.getElementById("enter_user").value.trim();
    Session.set('name', new_player_name);
    HTMLttpsreport.update({_id:Session.get('id')}, {$set: {username: new_player_name, lastPlayed: Date.now()}});
  };
}

if (Meteor.isServer) {

  var placesVisited = {};

  Meteor.startup(function () {
    var gameCount = 0;
    var places = [
      {
        name: "Machu Picchu",
        lat: -13.1583300,
        lon: -72.5313900
      },
      {
        name: "Great Sphinx",
        lat: 29.975309,
        lon: 31.137751
      },
      {
        name: "Hanging Gardens of Babylon",
        lat: 32.478476,
        lon: 44.441039
      },
      {
        name: "Mount Rushmore",
        lat: 43.880154,
        lon: -103.4593
      },
      {
        name: "The Great Wall of China",
        lat: 40.431941,
        lon: 116.558319
      },
      {
        name: "Bazar Old City",
        lat: 26.062204,
        lon: 84.609988
      },
      {
        name: "The Kremlin",
        lat: 55.752120,
        lon: 37.617665
      },
      {
        name: "Leaning Tower",
        lat: 43.722952,
        lon: 10.396597
      },
      {
        name: "The Acropolis",
        lat: 37.971532,
        lon: 23.725749
      },
      {
        name: "Stonehenge",
        lat: 51.178882,
        lon: -1.826215
      },
      {
        name: "The Ziggurat of Ur",
        lat: 30.962706,
        lon: 46.103085
      },
      {
        name: "Pyramids of Teotihuacan",
        lat: 19.692273,
        lon: -98.843503
      },
      {
        name: "Delphi",
        lat: 42.123604,
        lon: 14.702573
      },
      {
        name: "Borobudur",
        lat: -7.608000,
        lon: 110.204000
      },
      {
        name: "The Ajanta Caves",
        lat: 20.552756,
        lon: 75.700809
      },
      {
        name: "The Pantheon",
        lat: 41.898629,
        lon: 12.476867
      },
      {
        name: "The Hypogeum",
        lat: 35.869570,
        lon: 14.506885
      },
      {
        name: "Yongbyon Nuclear Scientific Research Centre",
        lat: 40.339852,
        lon: 127.510093
      },
      {
        name: "Angkor Wat",
        lat: 13.412469,
        lon: 103.866986
      },
      {
        name: "Bermuda Triangle",
        lat: 37.3563429,
        lon: -77.39113
      },
      {
        name: "The Loch Ness Monster",
        lat: 57.322857,
        lon: -4.424382
      },
      {
        name: "Nazca Lines",
        lat: -14.739027,
        lon: -75.130005
      },
      {
        name: "Lake Vostok",
        lat: -77.500000,
        lon: 106.000000
      },
      {
        name: "Taj Mahal",
        lat: 27.175009,
        lon: 78.041849
      },
      {
        name: "Grand Canyon",
        lat: 36.054445,
        lon: -112.140111
      },
      {
        name: "Mount Everest",
        lat: 27.985818,
        lon: 86.923596
      },
      {
        name: "Great Barrier Reef",
        lat: -18.286130,
        lon: 147.700008
      },
      {
        name: "Iguazu Falls",
        lat: -25.695278,
        lon: -54.436667
      },
      {
        name: "Halong Bay",
        lat: 20.848749,
        lon: 107.219358
      },
      {
        name: "Amazon Rainforest",
        lat: -4.750430,
        lon: -64.333070
      },
      {
        name: "Colosseum",
        lat: 41.890262,
        lon: 12.492310
      },
      {
        name: "Cairo Citadel",
        lat: 15.693648,
        lon: 43.606706
      },
      {
        name: "Iwo Jima",
        lat: 24.774024,
        lon: 141.327285
      },
      {
        name: "Mumbai",
        lat: 19.075984,
        lon: 72.877656
      },
      {
        name: "Mecca",
        lat: 21.416667,
        lon: 39.816667
      },
      {
        name: "Detroit",
        lat: 42.331427,
        lon: -83.045754
      },
      {
        name: "Vacaville",
        lat: 38.356577,
        lon: -121.987744
      },
      {
        name: "Pearl Harbour",
        lat: 21.344507,
        lon: -157.974891
      },
      {
        name: "Les Egouts de Paris",
        lat: 48.856614,
        lon: 2.352222
      },
      {
        name: "Venice",
        lat: 45.440847,
        lon: 12.315515
      },
      {
        name: "Temple of Karnak",
        lat: 25.718833,
        lon: 32.657271
      },
      {
        name: "Forbidden City",
        lat: 39.915590,
        lon: 116.396977
      },
      {
        name: "Alhambra",
        lat: 38.900000,
        lon: -3.050000
      },
      {
        name: "Hagia Sophia",
        lat: 41.008356,
        lon: 28.980099
      }
    ];

    Meteor.methods({
      begin_round: function(){
        gameCount++;
        CurrentGame.remove({});
        CurrentPoints.remove({});
        var index = Meteor.call('get_place', gameCount);
        var place = places[index];
        CurrentGame.insert({name: place.name, lat:place.lat, lon:place.lon});
      },

      get_place: function(gameCount){
        var index = Math.floor(Math.random()*places.length);

          // if the place was visited in the last 9 rounds, pick a new one
        if(placesVisited[index] && (gameCount - placesVisited[index])<10) {
          while(placesVisited[index]) {
            index = Math.floor(Math.random()*places.length);
          }
        } else {
          placesVisited[index] = gameCount;
        }
        return index;
      },

        // set score
      db_info_version: function(uid, points){
        if(points<11) {
          HTMLttpsreport.update({_id:uid}, {$inc: {score: points}});
          HTMLttpsreport.update({_id:uid}, {$set: {lastPlayed: Date.now()}});
        }
      }
    });
    Players.insert({0:"one",1:"step",2:"ahead",3:"of",4:"ya!",5:"u",6:"madd",7:"bro?"});
 
    Meteor.setInterval(function(){
      Meteor.call('begin_round');
    }, 6000);
  });
}
