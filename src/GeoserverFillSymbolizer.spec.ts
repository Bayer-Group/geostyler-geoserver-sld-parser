import GeoserverSldStyleParser from './GeoserverSldStyleParser'

const polygonSimpleGraphicFill: any = {
  name: 'My Style',
  rules: [
    {
      name: 'My Rule',
      symbolizers: [
        {
          "kind": "Fill",
          "color": "#a5c9e5",
          "graphicFill": {
            "kind": "Mark",
            "wellKnownName": "Star",
            "radius": 8,
            "color": "#0000FF",
          },
          "graphic-margin": '3 5 10'
        },
      ],
    },
  ],
};


const sldOutput = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<StyledLayerDescriptor version="1.0.0" xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <NamedLayer>
    <Name>My Style</Name>
    <UserStyle>
      <Name>My Style</Name>
      <Title>My Style</Title>
      <FeatureTypeStyle>
        <Rule>
          <Name>My Rule</Name>
          <PolygonSymbolizer>
            <Fill>
              <GraphicFill>
                <Graphic>
                  <Mark>
                    <WellKnownName>star</WellKnownName>
                    <Fill>
                      <CssParameter name="fill">#0000FF</CssParameter>
                    </Fill>
                  </Mark>
                  <Size>16</Size>
                </Graphic>
              </GraphicFill>
              <CssParameter name="fill">#a5c9e5</CssParameter>
            </Fill>
            <VendorOption name="graphic-margin">3 5 10</VendorOption>
          </PolygonSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>
`

const parser = new GeoserverSldStyleParser();

describe('GeoserverFillSymbolizer', () => {
  describe('#writeStyle', () => {
    it('transforms graphic-margin in VendorOptions', () => {
      expect.assertions(1);
      parser
        .writeStyle(polygonSimpleGraphicFill).then(sld => {
        expect(sld).toEqual(sldOutput);
      });
    });
  });
  describe('#readStyle', () => {
    it('reads VendorOptions graphic-margin', () => {
      expect.assertions(1);
      parser
        .readStyle(sldOutput).then(gsObject => {
        expect(gsObject).toEqual(polygonSimpleGraphicFill);
      });
    });
  });
});
