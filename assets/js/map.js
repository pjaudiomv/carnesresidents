/**
 *  Handle Google map operations
 */
var base_icon = {
  path: "M10.453 14.016l6.563-6.609-1.406-1.406-5.156 5.203-2.063-2.109-1.406 1.406zM12 2.016q2.906 0 4.945 2.039t2.039 4.945q0 1.453-0.727 3.328t-1.758 3.516-2.039 3.070-1.711 2.273l-0.75 0.797q-0.281-0.328-0.75-0.867t-1.688-2.156-2.133-3.141-1.664-3.445-0.75-3.375q0-2.906 2.039-4.945t4.945-2.039z",
  fillOpacity: 0.9,
  strokeWeight: 0,
  scale: 1,
};
var googleMap = {
  self: false,
  loaded: false,
  map: false,
  json_file_path: false,
  markers: [],
  infoWindow: false,
  force_center: false,

  // Custom Icons
  icons: {
    // "sales": "/assets/images/area-map/icons/realestatesale.svg",
    "community-amenities": {
      ...base_icon,
      fillColor: "#55c0b0",
    },
    neighborhoods: {
      ...base_icon,
      fillColor: "#526276",
    },
    "parks-lakes": {
      ...base_icon,
      fillColor: "#695e49",
    },
    "real-estate": {
      ...base_icon,
      fillColor: "#ff131d",
    },
    "town-medical-office": {
      ...base_icon,
      fillColor: "#bd7515",
    },
  },

  initialize: function () {
    self = this;

    force_center = $("[data-map][data-center]").length;
    force_zoom = $("[data-map][data-zoom]").length;

    // set defaults
    var center = force_center
      ? $("[data-map][data-center]").data("center")
      : [33.053664, -80.106505];
    var zoom = force_zoom ? $("[data-map][data-zoom]").data("zoom") : 15;
    var mapOptions = {
      zoom: zoom,
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.LEFT_TOP,
      },
      streetViewControl: false,
      mapTypeControl: false,
      scrollwheel: false,
      center: new google.maps.LatLng(center[0], center[1]),
    };

    self.map = new google.maps.Map(
      document.getElementById("map-canvas"),
      mapOptions
    );
    self.infoWindow = new google.maps.InfoWindow();

    // self.resizeListener();
    //self.clickListener();
    var bounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(33.050528, -80.118405),
      new google.maps.LatLng(33.070764, -80.087128)
    );

    var mapMinZoom = 13;
    var mapMaxZoom = 18;
    var maptiler = new google.maps.ImageMapType({
      getTileUrl: function (coord, zoom) {
        var proj = self.map.getProjection();
        var z2 = Math.pow(2, zoom);
        var tileXSize = 256 / z2;
        var tileYSize = 256 / z2;
        var tileBounds = new google.maps.LatLngBounds(
          proj.fromPointToLatLng(
            new google.maps.Point(
              coord.x * tileXSize,
              (coord.y + 1) * tileYSize
            )
          ),
          proj.fromPointToLatLng(
            new google.maps.Point(
              (coord.x + 1) * tileXSize,
              coord.y * tileYSize
            )
          )
        );
        var x = coord.x >= 0 ? coord.x : z2 + coord.x;
        var y = coord.y;
        if (
          bounds.intersects(tileBounds) &&
          mapMinZoom <= zoom &&
          zoom <= mapMaxZoom
        )
          return "images/map/2021-02-25/" + zoom + "/" + x + "/" + y + ".png";
        else return "images/blank.png";
      },
      tileSize: new google.maps.Size(256, 256),
      isPng: true,
      name: "Rendered with MapTiler Desktop",
      alt: "Rendered with MapTiler Desktop",

      opacity: 1.0,
    });
    self.map.overlayMapTypes.insertAt(0, maptiler);

    // Create markers and place them on the map
    if (json_file_path) {
      self.buildMarkersFromJSON(function () {
        // Filter markers on groups
        self.toggleFilters();
        self.fitBoundsToVisibleMarkers();
        $("[data-map-filters] input[type=checkbox]").change(function (e) {
          self.toggleFilters();
          self.fitBoundsToVisibleMarkers();
        });
      });
    } else {
      self.buildMarkersFromMarkup(function () {
        self.fitBoundsToVisibleMarkers();
      });
    }
  },

  /**
   * Asynchronos load of the api, call initialize after load
   *
   */
  loadMap: function (json_file_path) {
    // trackEvent('Maps', 'Load API');

    var script = document.createElement("script");
    self.loaded = true;
    self.json_file_path = json_file_path;
    script.type = "text/javascript";
    script.src =
      "https://maps.googleapis.com/maps/api/js?key=AIzaSyDolzT1yWJuPi6y3tP85fuh3JbPJfJnWeM&callback=googleMap.initialize";
    document.body.appendChild(script);
  },

  /**
   * Re-center and re-zoom map on resize
   */
  resizeListener: function () {
    google.maps.event.addDomListener(window, "resize", function () {
      var center = self.map.getCenter();
      var zoom = 15;
      google.maps.event.trigger(self.map, "resize");
      self.map.setCenter(center);
      self.map.setZoom(zoom);
    });
  },

  /**
   * Build markers from a JSON file
   */
  buildMarkersFromJSON: function (callback) {
    $.get(json_file_path, function (data) {
      var markers = data["markers"];
      for (var i = 0; i < markers.length; i++) {
        self.markers[i] = self.createMarker(
          new google.maps.LatLng(markers[i]["lat"], markers[i]["lng"]),
          markers[i],
          markers[i]["group"]
        );
      }
      callback();
    });
  },

  /**
   *  Build markers from data attributes in our markup
   */
  buildMarkersFromMarkup: function (callback) {
    $("[data-lat]").each(function (i, e) {
      var lat = parseFloat($(e).data("lat"));
      var lng = parseFloat($(e).data("lng"));
      var title = $(e).data("title");
      self.markers[i] = self.createMarker(
        new google.maps.LatLng(lat, lng),
        title
      );
    });
    callback();
  },
  /**
   * Create a marker with an info window
   */
  createMarker: function (position, data, group) {
    // console.log(self.icons[group])
    var marker = new google.maps.Marker({
      map: self.map,
      position: position,
      icon: {
        //...self.icons[group],
        size: new google.maps.Size(40, 70),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(20, 70),
      }, // use generic pin if group doesn't exist

      group: group,
    });
    var html = `
		<div class="mapinfo">
			<div class="mapinfo__image" style="${data["image"] ? "" : "display:none;"}">
				<div class="image-wrap">
					<div class="image-bg"><img class="mapinfo-img" src="${data["image"]}"/></div>
				</div>
			</div>
			<div class="mapinfo__copy">
				<h5 class="mapinfo-title">
					<a href="${data["url"]}">${data["title"]}</a>
				</h5>
				<div class="mapinfo-notes">${data["notes"]}</div>
			</div>
		</div>
		`;
    self.bindInfoWindow(marker, html);

    return marker;
  },

  bindInfoWindow: function (marker, html) {
    google.maps.event.addListener(marker, "click", function () {
      if (!marker.open) {
        self.infoWindow.setContent(html);
        self.infoWindow.open(self.map, marker);
        marker.open = true;
      } else {
        self.infoWindow.close();
        marker.open = false;
      }
      google.maps.event.addListener(self.map, "click", function () {
        self.infoWindow.close();
        marker.open = false;
      });
    });
  },

  toggleFilters: function () {
    var groups = $("[data-map-filters] input[type=checkbox]:checked")
      .map(function () {
        return $(this).val();
      })
      .get();

    if (!groups.length) {
      $.each(self.markers, function (i, marker) {
        marker.setVisible(true);
      });
    } else {
      $.each(self.markers, function (i, marker) {
        marker.setVisible(false);
      });
      $.each(groups, function (i, group) {
        for (var i = 0; i < self.markers.length; i++) {
          if (self.markers[i]["group"] == group) {
            self.markers[i].setVisible(true);
          }
        }
      });
    }
  },

  fitBoundsToVisibleMarkers: function () {
    if (force_center) {
      return false;
    }

    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < self.markers.length; i++) {
      if (self.markers[i].getVisible()) {
        bounds.extend(self.markers[i].getPosition());
      }
    }
    self.map.fitBounds(bounds);
  },

  clickListener: function () {
    self.map.addListener("click", (mapsMouseEvent) => {
      // Close the current InfoWindow.
      console.log(JSON.stringify(mapsMouseEvent.latLng.toJSON(), null, 2));
    });
  },
};

$(document).ready(function () {
  if ($("[data-map]").length) {
    googleMap.loadMap("assets/data/markers.json");
  }

  $("[data-map-filters-toggle]").click(function () {
    $(this).toggleClass("is-open");
    $("[data-map-filters-list]").slideToggle();
  });
});
