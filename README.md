# geostyler-geoserver-sld-parser

[GeoStyler](https://github.com/terrestris/geostyler/) Style Parser implementation for Geoserver Styled Layer Descriptor (SLD). The parser extends [geostyler-sld-parser](https://github.com/terrestris/geostyler-sld-parser/) but adds geoserver-specific functionality such as support for `VendorOption` tags.

### How to use
```js
import SLDParser from "geostyler-geoserver-sld-parser";

const pointSimplePoint = {
  name: "My Style",
  rules: [
    {
      name: "My Rule",
      symbolizers: [
        {
          kind: "Mark",
          wellKnownName: "Circle",
          color: "#FF0000",
          radius: 6
        }
      ]
    }
  ]
};

const parser = new SLDParser();

parser
  .writeStyle(pointSimplePoint)
  .then(sld => console.log(sld))
  .catch(error => console.log(error));


// Read style from string
let sldString = '<?xml version="1.0" encoding="UTF-8"?><sld:StyledLayerDescriptor xmlns="http://www.opengis.net/sld" xmlns:sld="http://www.opengis.net/sld" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" version="1.0.0"> <sld:NamedLayer> <sld:Name>Default Styler</sld:Name> <sld:UserStyle> <sld:Name>Default Styler</sld:Name> <sld:Title>Gravel_Program_2016</sld:Title> <sld:FeatureTypeStyle> <sld:Name>name</sld:Name> <sld:Rule> <sld:MinScaleDenominator>1.0</sld:MinScaleDenominator> <sld:MaxScaleDenominator>1.0E7</sld:MaxScaleDenominator> <sld:LineSymbolizer> <sld:Stroke> <sld:CssParameter name="stroke">#8000FF</sld:CssParameter> <sld:CssParameter name="stroke-width">3.000</sld:CssParameter> </sld:Stroke> </sld:LineSymbolizer> </sld:Rule> </sld:FeatureTypeStyle> </sld:UserStyle> </sld:NamedLayer> </sld:StyledLayerDescriptor>';

parser
  .readStyle(sldString)
  .then(sldObject => console.log(sldObject))
  .catch(error => console.log(error));
```
