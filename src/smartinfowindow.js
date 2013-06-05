/**
 * A SmartInfoWindow is like an info window, but it displays
 * under the marker, opens quicker, and has flexible styling.
 * @param {Object} opts Passes configuration options.
 */
function SmartInfoWindow(opts) {
  google.maps.OverlayView.call(this);
  
  this.latlng_ = opts.position;
  this.content_ = opts.content;
  this.map_ = opts.map;
  this.div_ = null;
  //this.original_width = 
  this.width_ = opts.width;
  //this.original_height = 
  this.height_ = opts.height;
  this._closeText = opts.closeText || null;
  //this.size_ = new google.maps.Size(this.height_, this.width_);
  //this.offsetVertical_ = -this.height_;
  //this.offsetHorizontal_ = 0;
  this.panned_ = false;

  this.setMap(this.map_);

  // Close the previous SmartInfoWindow
  if(SmartInfoWindow.current != null) {
	  SmartInfoWindow.current.onRemove();
	  //console.log('SmartInfoWindow.current.onRemove');
  }
  SmartInfoWindow.current = this;

  // We need to listen to bounds_changed event so that we can redraw
  // absolute position every time the map moves.
  // This is only needed because we append to body instead of map panes.
  var me = this;
  google.maps.event.addListener(this.map_, 'bounds_changed', function() {
    me.draw();
  });
}

/**
 * Stores the current instance.
 */
SmartInfoWindow.current = null;

/**
 * SmartInfoWindow extends OverlayView class from the Google Maps API
 */
SmartInfoWindow.prototype = new google.maps.OverlayView();

/**
 * Creates the DIV representing this SmartInfoWindow
 */
SmartInfoWindow.prototype.onRemove = function() {
  if (this.div_ != null) {
    this.div_.parentNode.removeChild(this.div_);
    this.div_ = null;
  }
};

/**
 * Called when the overlay is first added to the map.
 */
SmartInfoWindow.prototype.onAdd = function() {
	//console.log('SmartInfoWindow.prototype.onAdd');
  // Creates the element if it doesn't exist already.
  this.createElement();
};

/**
 * Redraw based on the current projection and zoom level.
 */
SmartInfoWindow.prototype.draw = function() {
	//console.log('SmartInfoWindow.prototype.draw');
  // Since we use bounds changed listener, projection is sometimes null
  if (!this.getProjection()) {
    return;
  }
  
  //TODO Not sure why this happens
  // Seems to be when a new SmartInfoWindow is drawn, but not fully on screen.
  if(this.div_ == null) {
	  return;
  }

  // This gives us the position in the tiles div.
  var pixPosition = this.getProjection().fromLatLngToDivPixel(this.latlng_);
  var centerPosition = this.getProjection().fromLatLngToDivPixel(this.map_.getCenter());
  var centerPositionReal = new google.maps.Point(this.map_.getDiv().offsetWidth/2, this.map_.getDiv().offsetHeight/2);
  // Figure out difference between map div and tiles div, so that we can
  // calculate position in map div
  var centerOffsetX = -centerPosition.x + centerPositionReal.x;
  var centerOffsetY = -centerPosition.y + centerPositionReal.y;

  if (!pixPosition) {
	  return;
  }
  //TODO Make this whole bit dynamic
  var alignment = this.getBestAlignment();
  var paddingTop = 0,
      paddingBottom = 0,
      paddingLeft = 0,
      paddingRight = 0,
      widthLess = 0,
      heightLess = 0,
      padding_x = 20,
      padding_y = 20;
  switch (alignment) {
    case SmartInfoWindow.Align.ABOVE:
      this.div_.className = "SmartInfoWindow above";
//      this.width_ = this.original_width;
//      this.height_ = this.original_height;
      //this.width_ = 280;
      //this.height_ = 351;
      //image = 'infobox_above.gif';
      this.offsetX_ = -(this.width_ / 2 - 17);
      this.offsetY_ = -(this.height_ + 32);
      paddingBottom = padding_x;
      heightLess = padding_x;
      break;
    case SmartInfoWindow.Align.BELOW:
      this.div_.className = "SmartInfoWindow below";
//      this.width_ = this.original_width;
//      this.height_ = this.original_height;
      //this.width_ = 280;
      //this.height_ = 351;
      //image = 'infobox_below.gif';
      this.offsetX_ = -(this.width_ / 2 - 17);
      this.offsetY_ = 6;
      paddingTop = padding_x;
      heightLess = padding_x;
      break;
    case SmartInfoWindow.Align.LEFT:
      this.div_.className = "SmartInfoWindow left";
//      this.width_ = this.original_width/* + 27*/;
//      this.height_ = this.original_height/* - 25*/;
      //this.width_ = 307;
      //this.height_ = 326;
      //image = 'infobox_left.gif';
      this.offsetX_ = -(this.width_) - 26;
      this.offsetY_ = -(this.height_ / 2 + 33);
      paddingRight = padding_y,
      widthLess = padding_y;
      break;
    case SmartInfoWindow.Align.RIGHT:
      this.div_.className = "SmartInfoWindow right";
      //image = 'infobox_right.gif';
//      this.width_ = this.original_width/* + 27*/;
//      this.height_ = this.original_height/* - 25*/;
      //this.width_ = 307;
      //this.height_ = 326;
      this.offsetX_ = 6;
      this.offsetY_ = -(this.height_ / 2 + 33);
      paddingLeft = padding_y;
      widthLess = padding_y;
      break;
   }
  // Now position our DIV based on the DIV coordinates of our bounds
  this.div_.style.width = (this.width_ + widthLess) + 'px';
  this.div_.style.left = (pixPosition.x + this.offsetX_) + centerOffsetX + 'px';
  this.div_.style.height = (this.height_ + heightLess) + 'px';
  this.div_.style.top = (pixPosition.y + this.offsetY_) + centerOffsetY + 'px';
  //this.div_.style.paddingTop = paddingTop + 'px';
  //this.div_.style.paddingLeft = paddingLeft + 'px';
  //this.div_.style.background = 'url("images/' + image + '")';
  this.div_.style.display = 'block';
 
  this.wrapperDiv_.style.width = (this.width_/*- widthLess*/) + 'px';
  this.wrapperDiv_.style.height = (this.height_/* - heightLess*/) + 'px';
  this.wrapperDiv_.style.marginTop = paddingTop + 'px';
  this.wrapperDiv_.style.marginBottom = paddingBottom + 'px';
  this.wrapperDiv_.style.marginLeft = paddingLeft + 'px';
  this.wrapperDiv_.style.marginRight = paddingRight + 'px';
  this.wrapperDiv_.style.overflow = 'hidden';
  if (!this.panned_) {
    this.panned_ = true;
    //TODO Pass dimensions and offset values in here.
    this.maybePanMap();
  }
};

/**
 * Creates the DIV representing this SmartInfoWindow in the floatPane.  If the panes
 * object, retrieved by calling getPanes, is null, remove the element from the
 * DOM.  If the div exists, but its parent is not the floatPane, move the div
 * to the new pane.
 * Called from within onAdd.  Alternatively, this can be called specifically on
 * a panes_changed event.
 */
SmartInfoWindow.prototype.createElement = function() {
  var panes = this.getPanes();
  var div = this.div_;
  if (div == null) {
    // This does not handle changing panes.  You can set the map to be null and
    // then reset the map to move the div.
    div = this.div_ = document.createElement('div');
    //div.style.border = '0px none';
    div.style.position = 'absolute';
    //div.style.overflow = 'hidden';
    var wrapperDiv = this.wrapperDiv_ = document.createElement('div');
    var contentDiv = document.createElement('div');
    if (typeof this.content_ == 'string') {
      contentDiv.innerHTML = this.content_;
    }
    else {
      contentDiv.appendChild(this.content_);
    }

    //var topDiv = document.createElement('div');
    //topDiv.style.textAlign = 'right';
    var close_button = document.createElement('a');
    if(typeof this._closeText == "string") {
    	close_button.appendChild(document.createTextNode(this._closeText));
    }
    close_button.className = "close";
    //topDiv.appendChild(close_button);
    wrapperDiv.appendChild(close_button);

    function removeSmartInfoWindow(ib) {
      return function() {
        ib.setMap(null);
      };
    }

    google.maps.event.addDomListener(close_button, 'click', removeSmartInfoWindow(this));
    wrapperDiv.className = "wrapper";
    //wrapperDiv.appendChild(topDiv);
    wrapperDiv.appendChild(contentDiv);
    div.appendChild(wrapperDiv);
    div.style.display = 'none';
    // Append to body, to avoid bug with Webkit browsers
    // attempting CSS transforms on IFRAME or SWF objects
    // and rendering badly.
    //document.body.appendChild(div);
    
    // Not sure what that comment means. I'm just adding it to the map element. - jj
    this.map_.getDiv().appendChild(div);
  }
  else if (div.parentNode != panes.floatPane) {
    // The panes have changed.  Move the div.
    div.parentNode.removeChild(div);
    panes.floatPane.appendChild(div);
  }
  /*else {
    // The panes have not changed, so no need to create or move the div.
  }*/
};

//TODO Find out what this does.
SmartInfoWindow.mouseFilter = function(e) {
  e.returnValue = 'true';
  e['handled'] = true;
}

/**
 * Closes infowindow
 */
SmartInfoWindow.prototype.close = function() {
  this.setMap(null);
};

/**
 * Pan the map to fit the SmartInfoWindow,
 * if its top or bottom corners aren't visible.
 */
SmartInfoWindow.prototype.maybePanMap = function() {
  // if we go beyond map, pan map
  var map = this.map_;
  var projection = this.getProjection();
  var bounds = map.getBounds();
  if (!bounds) {
	  return;
  }

  // The dimension of the infowindow
  var iwWidth = this.width_,
      iwHeight = this.height_;

  // The offset position of the infowindow
  var iwOffsetX = this.offsetX_,
      iwOffsetY = this.offsetY_;

  var anchorPixel = projection.fromLatLngToDivPixel(this.latlng_),
      bl = new google.maps.Point(
    		  anchorPixel.x + iwOffsetX + 20,
              anchorPixel.y + iwOffsetY + iwHeight
           ),
      tr = new google.maps.Point(
    		  anchorPixel.x + iwOffsetX + iwWidth,
              anchorPixel.y + iwOffsetY
           ),
      sw = projection.fromDivPixelToLatLng(bl),
      ne = projection.fromDivPixelToLatLng(tr);

  // The bounds of the infowindow
  if (!map.getBounds().contains(ne) || !map.getBounds().contains(sw)) {
    map.panToBounds(new google.maps.LatLngBounds(sw, ne));
  }
};

/**
 * @enum {number}
 */
SmartInfoWindow.Align = {
  ABOVE: 0,
  LEFT: 1,
  RIGHT: 2,
  BELOW: 3
};

/**
 * Finds best alignment for infowindow.
 * @return {number} Alignment.
 */
SmartInfoWindow.prototype.getBestAlignment = function() {
  var bestAlignment = SmartInfoWindow.Align.LEFT;
  var minPan = 0;

  for (var alignment in SmartInfoWindow.Align) {
    var alignment = SmartInfoWindow.Align[alignment];
    var panValue = this.getPanValue(alignment);
    if (panValue > minPan) {
      minPan = panValue;
      bestAlignment = alignment;
    }
  }

  return bestAlignment;
};

/**
 * Calculates distance of corner for each alignment.
 * @param {number} alignment An alignment constant.
 * @return {number} Distance for that alignment.
 */
SmartInfoWindow.prototype.getPanValue = function(alignment) {
  var mapSize = new google.maps.Size(
		  this.map_.getDiv().offsetWidth,
          this.map_.getDiv().offsetHeight
      );
  var bounds = this.map_.getBounds();
  var sideLatLng;
  switch (alignment) {
    case SmartInfoWindow.Align.ABOVE:
      sideLatLng = new google.maps.LatLng(
          bounds.getNorthEast().lat(),
          this.latlng_.lng()
      );
      break;
    case SmartInfoWindow.Align.BELOW:
      sideLatLng = new google.maps.LatLng(
    	  bounds.getSouthWest().lat(),
          this.latlng_.lng()
      );
      break;
    case SmartInfoWindow.Align.RIGHT:
      sideLatLng = new google.maps.LatLng(
          this.latlng_.lat(),
          bounds.getNorthEast().lng()
      );
      break;
    case SmartInfoWindow.Align.LEFT:
      sideLatLng = new google.maps.LatLng(
    	  this.latlng_.lat(),
          bounds.getSouthWest().lng()
      );
      break;
  }
  
  return SmartInfoWindow.distHaversine(this.latlng_.lat(), this.latlng_.lng(),
      sideLatLng.lat(), sideLatLng.lng());
};


/**
 * Converts degrees to radians.
 * @param {number} num Angle in degrees.
 * @return {number} Angle in radians.
 */
SmartInfoWindow.toRad = function(num) {
    return num * Math.PI / 180;
}

/**
 * Calculates distance between two coordinates.
 * @param {number} lat1 Latitude of first coord.
 * @param {number} lon1 Longitude of second coord.
 * @param {number} lat2 Latitude of second coord.
 * @param {number} lon2 Longitude of second coord.
 * @return {number} The distance.
 */
SmartInfoWindow.distHaversine = function(lat1, lon1, lat2, lon2) {
  var R = 6371; // earth's mean radius in km
  var dLat = SmartInfoWindow.toRad(lat2 - lat1);
  var dLon = SmartInfoWindow.toRad(lon2 - lon1);
  lat1 = SmartInfoWindow.toRad(lat1), lat2 = SmartInfoWindow.toRad(lat2);

  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1) * Math.cos(lat2) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}
