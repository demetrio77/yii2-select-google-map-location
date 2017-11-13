/**
 * Выбор местоположения - виджет.
 * Виджет запоминает координаты при вводе адреса в инпут и отображает карту Google.
 * Необходимо передавать опции:
 * - address - селектор, для указания адреса;
 * - latitude - селектор для указания широты;
 * - longitude - селектор для указания долготы;
 * - zipcode - селектор для индекса
 * - state - селектор для штат
 * - city - селектор для города
 * - onLoadMap - если определена функциия, то она будет вызвана при инициализации карты;
 * - addressNotFound - сообщение о не найденном адресе.
 *
 * @param {Object}  options
 * @param {boolean} options.draggable Marker draggable Option
 * TODO: describe other options here
 */
(function($) {
    $.fn.selectLocation = function(options) {
        var self = this;
        var map;
     // маркер найденной точки
        var marker = null;
        
        $(document).ready(function() {
            var mapOptions = {
                center: new google.maps.LatLng(40.4406248, -79.9958864),
                zoom: 12,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                panControl: true
            };
            map = new google.maps.Map($(self).get(0), mapOptions);

            if (options.onLoadMap) {
                options.onLoadMap(map);
            }            

            /**
             * Создать/переместить маркер на карте
             * Передается объект типа google.maps.LatLng
             * @param {Object} latLng
             */
            var placeMarker = function(latLng) {
                // удалить маркер если уже был
                if (!marker) {
	                marker = new google.maps.Marker({
	                    'position'          : latLng,
	                    'map'               : map
	                });
                }
                else {
                	marker.setPosition(latLng);                	
                }
                map.setCenter(latLng);
            };
            
            var getPlace = function(latLng) {
                var geocoder = new google.maps.Geocoder();
                geocoder.geocode(
                    {
                        latLng: latLng
                    },
                    function(results, status) {
                    	if (status == google.maps.GeocoderStatus.OK) {
                            setAttributes(results[0]);
                        }

                        return false;
                    }
                );
            }

            /**
             * Установить координаты точки
             * @param {Object} point объект типа google.maps.LatLng
             */
            var setAttributes = function(point) {
                console.log(point);
                console.log(self);
                
                if (!point.geometry.location){
                	return ;
                }
                
                $(options.latitude).val(point.geometry.location.lat());
                $(options.longitude).val(point.geometry.location.lng());                
                
                if (! point.address_components){
                	return ;
                }
                
                $(options.address).val(point.formatted_address);
                
                for (c in point.address_components){
                	var component = point.address_components[c];
                	var type = component.types[0];
                	switch(type){
                		case "postal_code":
                			$(options.zipcode).val( component.long_name );
                	    break;
                		case 'locality':
                			$(options.city).val( component.long_name );
                	    break;
                		case "administrative_area_level_1":
                			$(options.state).val( component.long_name );
                	    break;
                	}
                }
            };

            /**
             * Выбрать местоположение, на входе объект у которго есть geometry
             * @param {Object} item
             */
            var selectLocation = function(item) {
            	if (!item.geometry) {
                    return;
                }
                var bounds = item.geometry.viewport ? item.geometry.viewport : item.geometry.bounds;
                var center = null;
                if (bounds) {
                    map.fitBounds(new google.maps.LatLngBounds(bounds.getSouthWest(), bounds.getNorthEast()));
                }
                if (item.geometry.location) {
                    center = item.geometry.location;
                }
                else if (bounds) {
                    var lat = bounds.getSouthWest().lat() + ((bounds.getNorthEast().lat() - bounds.getSouthWest().lat()) / 2);
                    var lng = bounds.getSouthWest().lng() + ((bounds.getNorthEast().lng() - bounds.getSouthWest().lng()) / 2);
                    center = new google.maps.LatLng(lat, lng);
                }
                if (center) {
                    map.setCenter(center);
                    placeMarker(center);
                    setAttributes(item);
                }
            };

            // валидация адреса, если не найдены координаты
            // испльзуется событие из ActiveForm
            if ($(options.address).parents('form').length) {
                var $form = $(options.address).parents('form');
                $form.on('afterValidateAttribute', function(e, attribute, messages) {
                    if (attribute.input == options.address && !$(options.latitude).val() && !$(options.longitude).val() && !messages.length) {
                        // не найдены координаты
                        messages.push(options.addressNotFound);
                        e.preventDefault();
                    }
                });
            }

            // автокомплит для поиска местонахождения
            var autocomplete = new google.maps.places.Autocomplete($(options.address).get(0));

            google.maps.event.addListener(autocomplete, 'place_changed', function() {
                var place = autocomplete.getPlace();
                if (!place) {
                    return;
                }
                selectLocation(place);
            });
            
            map.addListener('click', function(e) {
            	placeMarker(e.latLng);
            	getPlace(e.latLng);
            });

            var defaults = {
                'lat'       : $(options.latitude).val(),
                'lng'       : $(options.longitude).val()
            };
            if (defaults.lat && defaults.lng) {
                var center = new google.maps.LatLng(defaults.lat, defaults.lng);
                map.setCenter(center);
                placeMarker(center);
            }
        });
    };
})(jQuery);