import SldStyleParser from 'geostyler-sld-parser';
import GeoserverTextSymbolizer from './GeoserverTextSymbolizer';

class GeoserverSldStyleParser extends SldStyleParser {
  // reading SLD string and return object
  getTextSymbolizerFromSldSymbolizer(sldSymbolizer: any): GeoserverTextSymbolizer {
    const finalSymbolizer = super.getTextSymbolizerFromSldSymbolizer(sldSymbolizer)

    sldSymbolizer.VendorOption.forEach((option: any) => {
      const { $: { name }, _: value } = option;

      finalSymbolizer[name] = value;
    })

    return finalSymbolizer;
  }

  // write to xml2js compatible output format (which converts to a string..eventually)
  getSldTextSymbolizerFromTextSymbolizer(textSymbolizer: GeoserverTextSymbolizer): any {
    const finalSymbolizer = super.getSldTextSymbolizerFromTextSymbolizer(textSymbolizer)

    const vendorOptionsMap = [
      'partials',
      'repeat',
      'autoWrap',
      'maxDisplacements',
      'group',
      'spaceAround',
      'conflictResolution',
      'goodnessOfFit',
      'labelAllGroup',
      'polygonAlign'
    ]

    const vendorOption = Object.keys(textSymbolizer).filter((propertyName: string) => vendorOptionsMap.includes(propertyName))
      .map((propertyName: string) => {
        return {
          '_': textSymbolizer[propertyName],
          '$': { name: propertyName }
        }
    })

    finalSymbolizer.TextSymbolizer[0].VendorOption = vendorOption

    return finalSymbolizer
  }
}

export default GeoserverSldStyleParser;
