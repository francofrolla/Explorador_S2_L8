// Una interfaz grafica para visualizar imagenes de Sentinel 2 y Landsat 8, realizar combinaciones
// generar ndvi en sitios especificados y exportar los resultados
//ATENCION!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!  
// El sitio seleccionado debe ser dibujado con las herramientas Geometria, llamandolo poligono_lote
var app = {};

/** Creates the UI panels. */
var que_satelite = "false";
app.createPanels = function() {
  /* The introduction section. */
  app.intro = {
    panel: ui.Panel([
      ui.Label({
        value: 'Explorador Sentinel 2 - Landsat 8',
        style: {fontWeight: 'bold', fontSize: '24px', margin: '10px 5px'}
      }),
      ui.Label('Esta app permite la busqueda, procesamiento  ' +
               "y descarga de imagenes Sentinel 2 o Landsat 8 " + 
               "con la tecnologia de Google Earth Engine. " +
               "" +
               "Autor: frolla.franco@inta.gob.ar")
    ])
  };

  /* The collection filter controls. */
  app.filters = {
    landsat8: ui.Checkbox({label: 'Landsat 8', value: false}),
    mapCenter: ui.Checkbox({label: 'Centrar mapa', value: true}),
    startDate: ui.Textbox('YYYY-MM-DD', '2017-11-01'),
    endDate: ui.Textbox('YYYY-MM-DD', '2017-12-01'),
    applyButton: ui.Button('Aplicar filtros', app.applyFilters),
      loadingLabel: ui.Label({
      value: 'Cargando...',
      style: {stretch: 'vertical', color: 'gray', shown: false}
      })
   };
  
 que_satelite = app.filters.landsat8.getValue();
  
  
  /* The panel for the filter control widgets. */
  app.filters.panel = ui.Panel({
    widgets: [
      ui.Label('1) Seleccionar filtros', {fontWeight: 'bold'}),
      ui.Label('Fecha inicio', app.HELPER_TEXT_STYLE), app.filters.startDate,
      ui.Label('Fecha fin', app.HELPER_TEXT_STYLE), app.filters.endDate,
      app.filters.mapCenter,
      app.filters.landsat8,
      ui.Panel([
        app.filters.applyButton,
        app.filters.loadingLabel
        
      ], ui.Panel.Layout.flow('horizontal'))
    ],
    style: app.SECTION_STYLE
  });

  /* The image picker section. */
app.picker = {
    // Create a select with a function that reacts to the "change" event.
    select: ui.Select({
      placeholder: 'Seleccione una imagen',
      onChange: app.refreshMapLayer
    }),
    // Create a button that centers the map on a given object.
    centerButton: ui.Button('Centrar en mapa', function() {
      Map.centerObject(Map.layers().get(0).get('eeObject'));
    })
  };

  /* The panel for the picker section with corresponding widgets. */
app.picker.panel = ui.Panel({
    widgets: [
      ui.Label('2) Seleccione una imagen', {fontWeight: 'bold'}),
      ui.Panel([
        app.picker.select,
        app.picker.centerButton
      ], ui.Panel.Layout.flow('horizontal'))
    ],
    style: app.SECTION_STYLE
  });

app.select_VIS = function() {
if (que_satelite === false) {
  app.VIS_OPTIONS = app.VIS_OPTIONS_S2;
  app.vis.select.items().reset(Object.keys(app.VIS_OPTIONS));
  app.vis.select.setValue(app.vis.select.items().get(0));
} else {
  app.VIS_OPTIONS = app.VIS_OPTIONS_L8;
  app.vis.select.items().reset(Object.keys(app.VIS_OPTIONS));
  app.vis.select.setValue(app.vis.select.items().get(0));
}
};

  /* The visualization section. */
app.vis = {
    ndviButton: ui.Button('NDVI', app.ndvi),
    label: ui.Label(),
    // Create a select with a function that reacts to the "change" event.
      select: ui.Select({
      items: Object.keys(app.VIS_OPTIONS),
      onChange: function() {
        // Update the label's value with the select's description.
        
        
        var option = app.VIS_OPTIONS[app.vis.select.getValue()];
        app.vis.label.setValue(option.description);
        // Refresh the map layer.
        app.refreshMapLayer();
        
       }, 
      }
    )
};
  

  /* The panel for the visualization section with corresponding widgets. */
  app.vis.panel = ui.Panel({
    widgets: [
      ui.Label('3) Seleccione a visualización', {fontWeight: 'bold'}),
      app.vis.select,
      app.vis.ndviButton,
      app.vis.label
          ],
    style: app.SECTION_STYLE
  });

  // Default the select to the first value.
  app.vis.select.setValue(app.vis.select.items().get(0));

  /* The export section. */
  app.export = {
    button: ui.Button({
      label: 'Exportame!',
      // React to the button's click event.
      onClick: function() {
        // Select the full image id.
        var imageIdTrailer = app.picker.select.getValue();
        var imageId = app.COLLECTION_ID + '/' + imageIdTrailer;
        // Get the visualization options.
        var visOption = app.VIS_OPTIONS[app.vis.select.getValue()];
        // Export the image to Drive.
        Export.image.toDrive({
          image: ee.Image(imageId).select(visOption.visParams.bands),
          description: imageIdTrailer,
          scale: 10,
        });
      }//aca termina la primera funcion
    })//aca fin button 
    
  }; //aca termina el script
  
 
  /* The panel for the export section with corresponding widgets. */
  app.export.panel = ui.Panel({
    widgets: [
        ui.Label('4) Exportar vista previa', {fontWeight: 'bold'}),
            app.export.button
      ],
    style: app.SECTION_STYLE
  });
};

app.export2 = {
    button: ui.Button({
      label: 'Exportar NDVI',
      // React to the button's click event.
      onClick: function() {
        // Select the full image id.
        var imageId = app.picker.select.getValue();
        var imageIdTrailer = app.picker.select.getValue();
        var image = ee.Image(app.COLLECTION_ID + '/' + imageId);
        
        if (app.COLLECTION_ID == "COPERNICUS/S2"){
        var ndvi = image.select('B8').subtract(image.select('B4'))
           .divide(image.select('B8').add(image.select('B4')));
        }
        else {
          var ndvi = image.select('B5').subtract(image.select('B4'))
           .divide(image.select('B5').add(image.select('B4')));
        }
        var polygono_roi = ndvi.clip(poligono_lote);
        // Export the image to Drive.
        Export.image.toDrive({
          image: polygono_roi,
          description: 'NDVI_' + imageIdTrailer,
          scale: 10,
        });
      }//aca termina la primera funcion
    })//aca fin button 
    
  }; //aca termina el script

app.export2.panel = ui.Panel({
    widgets: [
        ui.Label('4) Exportar recorte', {fontWeight: 'bold'}),
            app.export2.button
      ],
    style: app.SECTION_STYLE
  });

//app.seleccionar.satelite = function () {
//  var satelite2 = app.filters.landsat8.getValue();
//  print(satelite2);
//};

/** Creates the app helper functions. */
app.createHelpers = function() {
  /**
   * Enables or disables loading mode.
   * @param {boolean} enabled Whether loading mode is enabled.
   */
  app.setLoadingMode = function(enabled) {
    // Set the loading label visibility to the enabled mode.
    app.filters.loadingLabel.style().set('shown', enabled);
    // Set each of the widgets to the given enabled mode.
    var loadDependentWidgets = [
      app.vis.select,
      app.filters.startDate,
      app.filters.endDate,
      app.filters.applyButton,
      app.filters.mapCenter,
      app.filters.landsat8,
      app.picker.select,
      app.picker.centerButton,
      app.export.button,
      app.export2.button
     
    ];
    loadDependentWidgets.forEach(function(widget) {
      widget.setDisabled(enabled);
    });
  };

  /** Applies the selection filters currently selected in the UI. */
  app.applyFilters = function() {
    Map.centerObject(poligono_lote, 14);
    app.setLoadingMode(true);
    que_satelite = app.filters.landsat8.getValue();
    //app.createConstants();
    app.select_VIS();
    var satelite = app.filters.landsat8.getValue();
      if (satelite === true) {
      app.COLLECTION_ID = 'LANDSAT/LC08/C01/T1_RT_TOA';
      print(app.COLLECTION_ID);
    }
    else {
    app.COLLECTION_ID = 'COPERNICUS/S2';
    }
    
    //app.createConstants();
    var filtered = ee.ImageCollection(app.COLLECTION_ID);
   
    // Filter bounds to the map if the checkbox is marked.
    if (app.filters.mapCenter.getValue()) {
      filtered = filtered.filterBounds(Map.getCenter());
    }
    
    
    // Set filter variables.
    var start = app.filters.startDate.getValue();
    if (start) start = ee.Date(start);
    var end = app.filters.endDate.getValue();
    if (end) end = ee.Date(end);
    if (start) filtered = filtered.filterDate(start, end);

    // Get the list of computed ids.
    var computedIds = filtered
        .limit(app.IMAGE_COUNT_LIMIT)
        .reduceColumns(ee.Reducer.toList(), ['system:index'])
        .get('list');

    computedIds.evaluate(function(ids) {
      // Update the image picker with the given list of ids.
      app.setLoadingMode(false);
      app.picker.select.items().reset(ids);
      // Default the image picker to the first id.
      app.picker.select.setValue(app.picker.select.items().get(0));
    });
  };

app.ndvi = function() {
  var imageId = app.picker.select.getValue();
  var image = ee.Image(app.COLLECTION_ID + '/' + imageId);
  print(app.COLLECTION_ID);
    
  if (app.COLLECTION_ID == 'LANDSAT/LC08/C01/T1_RT_TOA') {
      
      var ndvi = image.select('B5').subtract(image.select('B4'))
           .divide(image.select('B5').add(image.select('B4')));
      var cordenadas = poligono_lote.coordinates();
      var polygono_roi = ndvi.clip(poligono_lote);
      Map.addLayer(polygono_roi,{min: 0, max: 0.6, "palette":"FFFFFF, CE7E45, DF923D, F1B555, FCD163, 99B718, 74A901, 66A000, 529400, 3E8601, 207401, 056201, 004C00, 023B01, 012E01, 011D01, 011301"}, "NDVI L8");
  }
    else {
      var ndvi_s2 = image.select('B8').subtract(image.select('B4'))
           .divide(image.select('B8').add(image.select('B4')));
   var cordenadas_s2 = poligono_lote.coordinates();
   print(cordenadas);
   var polygono_roi_s2 = ndvi_s2.clip(poligono_lote);
   Map.addLayer(polygono_roi_s2,{min: 0, max: 0.6, "palette":"FFFFFF, CE7E45, DF923D, F1B555, FCD163, 99B718, 74A901, 66A000, 529400, 3E8601, 207401, 056201, 004C00, 023B01, 012E01, 011D01, 011301"}, "NDVI S2");
  }
  
//Map.addLayer(polygono_roi,{min: 0, max: 0.6, "palette":"FFFFFF, CE7E45, DF923D, F1B555, FCD163, 99B718, 74A901, 66A000, 529400, 3E8601, 207401, 056201, 004C00, 023B01, 012E01, 011D01, 011301"}, "recorte");

};

app.clipper = function() {
   var imageId = app.picker.select.getValue();
   var image = ee.Image(app.COLLECTION_ID + '/' + imageId);
   var ndvi = image.select('B8').subtract(image.select('B4'))
           .divide(image.select('B8').add(image.select('B4')));
  //var roi = ee.Geometry.Point([-62.96393394470215,-38.29418060993771]).buffer(3000);
  var polygono_roi = ndvi.clip(poligono_lote);
  //Map.addLayer(ndvi.clip(roi),{min: 0, max: 1, 'palette':'ffffff,fffcff,fff9ff,fff7ff,fff4ff,fff2ff,ffefff,ffecff,ffeaff,ffe7ff,ffe5ff,ffe2ff,ffe0ff,ffddff,ffdaff,ffd8ff,ffd5ff,ffd3ff,ffd0ff,ffceff,ffcbff,ffc8ff,ffc6ff,ffc3ff,ffc1ff,ffbeff,ffbcff,ffb9ff,ffb6ff,ffb4ff,ffb1ff,ffafff,ffacff,ffaaff,ffa7ff,ffa4ff,ffa2ff,ff9fff,ff9dff,ff9aff,ff97ff,ff95ff,ff92ff,ff90ff,ff8dff,ff8bff,ff88ff,ff85ff,ff83ff,ff80ff,ff7eff,ff7bff,ff79ff,ff76ff,ff73ff,ff71ff,ff6eff,ff6cff,ff69ff,ff67ff,ff64ff,ff61ff,ff5fff,ff5cff,ff5aff,ff57ff,ff55ff,ff52ff,ff4fff,ff4dff,ff4aff,ff48ff,ff45ff,ff42ff,ff40ff,ff3dff,ff3bff,ff38ff,ff36ff,ff33ff,ff30ff,ff2eff,ff2bff,ff29ff,ff26ff,ff24ff,ff21ff,ff1eff,ff1cff,ff19ff,ff17ff,ff14ff,ff12ff,ff0fff,ff0cff,ff0aff,ff07ff,ff05ff,ff02ff,ff00ff,ff00ff,ff0af4,ff15e9,ff1fdf,ff2ad4,ff35c9,ff3fbf,ff4ab4,ff55aa,ff5f9f,ff6a94,ff748a,ff7f7f,ff8a74,ff946a,ff9f5f,ffaa55,ffb44a,ffbf3f,ffc935,ffd42a,ffdf1f,ffe915,fff40a,ffff00,ffff00,fffb00,fff700,fff300,fff000,ffec00,ffe800,ffe400,ffe100,ffdd00,ffd900,ffd500,ffd200,ffce00,ffca00,ffc600,ffc300,ffbf00,ffbb00,ffb700,ffb400,ffb000,ffac00,ffa800,ffa500,ffa500,f7a400,f0a300,e8a200,e1a200,d9a100,d2a000,ca9f00,c39f00,bb9e00,b49d00,ac9c00,a59c00,9d9b00,969a00,8e9900,879900,7f9800,789700,709700,699600,619500,5a9400,529400,4b9300,439200,349100,2d9000,258f00,1e8e00,168e00,0f8d00,078c00,008c00,008c00,008700,008300,007f00,007a00,007600,007200,006e00,006900,006500,006100,005c00,005800,005400,005000,004c00'},"recorte");
  Map.addLayer(polygono_roi,{min: 0, max: 1, 'palette':'ffffff,fffcff,fff9ff,fff7ff,fff4ff,fff2ff,ffefff,ffecff,ffeaff,ffe7ff,ffe5ff,ffe2ff,ffe0ff,ffddff,ffdaff,ffd8ff,ffd5ff,ffd3ff,ffd0ff,ffceff,ffcbff,ffc8ff,ffc6ff,ffc3ff,ffc1ff,ffbeff,ffbcff,ffb9ff,ffb6ff,ffb4ff,ffb1ff,ffafff,ffacff,ffaaff,ffa7ff,ffa4ff,ffa2ff,ff9fff,ff9dff,ff9aff,ff97ff,ff95ff,ff92ff,ff90ff,ff8dff,ff8bff,ff88ff,ff85ff,ff83ff,ff80ff,ff7eff,ff7bff,ff79ff,ff76ff,ff73ff,ff71ff,ff6eff,ff6cff,ff69ff,ff67ff,ff64ff,ff61ff,ff5fff,ff5cff,ff5aff,ff57ff,ff55ff,ff52ff,ff4fff,ff4dff,ff4aff,ff48ff,ff45ff,ff42ff,ff40ff,ff3dff,ff3bff,ff38ff,ff36ff,ff33ff,ff30ff,ff2eff,ff2bff,ff29ff,ff26ff,ff24ff,ff21ff,ff1eff,ff1cff,ff19ff,ff17ff,ff14ff,ff12ff,ff0fff,ff0cff,ff0aff,ff07ff,ff05ff,ff02ff,ff00ff,ff00ff,ff0af4,ff15e9,ff1fdf,ff2ad4,ff35c9,ff3fbf,ff4ab4,ff55aa,ff5f9f,ff6a94,ff748a,ff7f7f,ff8a74,ff946a,ff9f5f,ffaa55,ffb44a,ffbf3f,ffc935,ffd42a,ffdf1f,ffe915,fff40a,ffff00,ffff00,fffb00,fff700,fff300,fff000,ffec00,ffe800,ffe400,ffe100,ffdd00,ffd900,ffd500,ffd200,ffce00,ffca00,ffc600,ffc300,ffbf00,ffbb00,ffb700,ffb400,ffb000,ffac00,ffa800,ffa500,ffa500,f7a400,f0a300,e8a200,e1a200,d9a100,d2a000,ca9f00,c39f00,bb9e00,b49d00,ac9c00,a59c00,9d9b00,969a00,8e9900,879900,7f9800,789700,709700,699600,619500,5a9400,529400,4b9300,439200,349100,2d9000,258f00,1e8e00,168e00,0f8d00,078c00,008c00,008c00,008700,008300,007f00,007a00,007600,007200,006e00,006900,006500,006100,005c00,005800,005400,005000,004c00'},"recorte");
 
};

  /** Refreshes the current map layer based on the UI widget states. */
  app.refreshMapLayer = function() {
    Map.clear();
    var imageId = app.picker.select.getValue();
    
    //if (que_satelite == "false") {
    if (imageId) {
      // If an image id is found, create an image.
      var image = ee.Image(app.COLLECTION_ID + '/' + imageId);
      // Add the image to the map with the corresponding visualization options.
      var visOption = app.VIS_OPTIONS[app.vis.select.getValue()];
      Map.addLayer(image, visOption.visParams, imageId);
      //app.ndvi();
     }
    //} //aca muera el if
    
    //if (satelite === true) {
    //if (imageId) {
      // If an image id is found, create an image.
      //var image = ee.Image(app.COLLECTION_ID + '/' + imageId);
      // Add the image to the map with the corresponding visualization options.
      //var visOption = app.VIS_OPTIONS_2[app.vis.select.getValue()];
      //Map.addLayer(image, visOption.visParams, imageId);
      //app.ndvi();
     //}
    //} //aca muera el if
    
  };
};


  
/** Creates the app constants. */
app.createConstants = function() {
  
  
  if (que_satelite === false) {
    app.COLLECTION_ID = 'COPERNICUS/S2';
   
  }  
  else {
    app.COLLECTION_ID ='LANDSAT/LC08/C01/T1_RT_TOA';
  
  } 
    
  
  app.SECTION_STYLE = {margin: '30px 0 0 0'};
  app.HELPER_TEXT_STYLE = {
      margin: '8px 0 -3px 8px',
      fontSize: '12px',
      color: 'gray'
  };
  
  app.IMAGE_COUNT_LIMIT = 30;
  
  
  app.VIS_OPTIONS = {
      'Natural color S2 (B4/B3/B2)': {
      description: 'Apariencia similar a la del ojo humano ',
             
      visParams: {gamma: 1.3, min: 400, max: 8000, bands: ['B4', 'B3', 'B2']}
    },
    'False color S2 (B8/B4/B3)': {
      description: 'Vegetaciones en roja, zonas urbanas  ' +
                   'en azul claro, y suelos en marron.',
      visParams: {bands: ['B5', 'B4', 'B3'],min:200, max:9000}
    },
    
    'Agricultura S2 (B11/B8A/B2)': {
      description: 'Vegetacion sana en tonos de verde, tierra arrada ' +
                   'o sin cultivo en colores magenta',
      visParams: {gamma: 1.3, min: 400, max: 8000, bands: ['B11', 'B8A', 'B2']}
     }
  }; 

 app.VIS_OPTIONS_S2 = {
      'Natural color S2 (B4/B3/B2)': {
      description: 'Apariencia similar a la del ojo humano ',
             
      visParams: {gamma: 1.3, min: 400, max: 8000, bands: ['B4', 'B3', 'B2']}
    },
    'False color S2 (B8/B4/B3)': {
      description: 'Vegetaciones en roja, zonas urbanas  ' +
                   'en azul claro, y suelos en marron.',
      visParams: {bands: ['B5', 'B4', 'B3'],min:200, max:9000}
    },
    
    'Agricultura S2 (B11/B8A/B2)': {
      description: 'Vegetacion sana en tonos de verde, tierra arrada ' +
                   'o sin cultivo en colores magenta',
      visParams: {gamma: 1.3, min: 400, max: 8000, bands: ['B11', 'B8A', 'B2']}
     }
  }; 

  app.VIS_OPTIONS_L8 = {
            'Natural color L8 (B4/B3/B2)': {
            description: 'Apariencia similar a la del ojo humano ',
             
  visParams: {gamma: 1.3, min: 0.1, max: 0.3, bands: ['B4', 'B3', 'B2']}
   },
  'False color L8 (B5/B4/B3)': {
   description: 'Vegetaciones en roja, zonas urbanas  ' +
                'en azul claro, y suelos en marron.',
  visParams: {bands: ['B5', 'B4', 'B3'],min:0.1, max:0.3}
  },
  
  'Agricultura L8 (B6/B5/B2)': {
    description: 'Vegetacion sana en tonos de verde, tierra arrada ' +
                'o sin cultivo en colores magenta',
  visParams: {gamma: 1.3, min: 0.1, max: 0.3, bands: ['B6', 'B5', 'B2']}
  }
 }; 
};


/** Creates the application interface. */
app.boot = function() {
  app.createConstants();
  app.createHelpers();
  app.createPanels();
  //app.seleccionar.satelite();
  var main = ui.Panel({
    widgets: [
      app.intro.panel,
      app.filters.panel,
      app.picker.panel,
      app.vis.panel,
      app.export.panel,
      app.export2.panel
      
    ],
    style: {width: '320px', padding: '8px'}
  });
 
 
 Map.centerObject(poligono_lote, 14);
 

 
  ui.root.insert(0, main);
  app.applyFilters();
};

app.boot();
