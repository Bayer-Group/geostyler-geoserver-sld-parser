import SldStyleParser from 'geostyler-sld-parser';
import GeoserverTextSymbolizer from './GeoserverTextSymbolizer';

const VENDOR_OPTIONS_MAP = [
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

class GeoserverSldStyleParser extends SldStyleParser {
  // reading SLD string and return object
  getTextSymbolizerFromSldSymbolizer(sldSymbolizer: any): GeoserverTextSymbolizer {
    const finalSymbolizer = super.getTextSymbolizerFromSldSymbolizer(sldSymbolizer)

    // if there are vendor options, parse them and assign to the final symbolizer
    if (Array.isArray(sldSymbolizer.VendorOption)) {
      const assignOption = (option: any) => {
        const { $: { name }, _: value } = option;

        finalSymbolizer[name] = value;
      }

      sldSymbolizer.VendorOption.forEach(assignOption);
    }

    finalSymbolizer['LabelPlacement'] = sldSymbolizer.LabelPlacement;

    return finalSymbolizer;
  }

  // write to xml2js compatible output format (which converts to a string..eventually)
  getSldTextSymbolizerFromTextSymbolizer(textSymbolizer: GeoserverTextSymbolizer): any {
    const finalSymbolizer = super.getSldTextSymbolizerFromTextSymbolizer(textSymbolizer);

    const vendorOption = Object.keys(textSymbolizer).filter((propertyName: string) => VENDOR_OPTIONS_MAP.includes(propertyName))
      .map((propertyName: string) => {
        return {
          '_': textSymbolizer[propertyName],
          '$': { name: propertyName }
        }
    });

    finalSymbolizer.TextSymbolizer[0].VendorOption = vendorOption;

    finalSymbolizer.TextSymbolizer[0].LabelPlacement = textSymbolizer.LabelPlacement;

    return finalSymbolizer;
  }
}

export default GeoserverSldStyleParser;
