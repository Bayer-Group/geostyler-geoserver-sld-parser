import GeoserverSldStyleParser from '../src/GeoserverSldStyleParser';

const pointSimpleText: any = {
  name: 'My Style',
  rules: [
    {
      name: 'My Rule',
      symbolizers: [
        {
          kind: 'Text',
          label: 'hello',
          spaceAround: '6',
          LabelPlacement: ['10'],
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
          <TextSymbolizer>
            <Label>
              <ogc:Literal>hello</ogc:Literal>
            </Label>
            <VendorOption name="spaceAround">6</VendorOption>
            <LabelPlacement>10</LabelPlacement>
          </TextSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>`;
const parser = new GeoserverSldStyleParser();

describe('GeoserverTextSymbolizer',  () => {
  describe('#writeStyle', () => {
    it('transforms spaceAround in VendorOptions', async () => {
      expect.assertions(1);
      const sld: string = await parser.writeStyle(pointSimpleText);
      expect(sld).toEqual(sldOutput);
    });
  });
  describe('#readStyle',  () => {
    it('reads VendorOptions space-around', async () => {
      expect.assertions(1);
      const gsObject = await parser.readStyle(sldOutput);
      expect(gsObject).toEqual(pointSimpleText);
    });
  });
});
