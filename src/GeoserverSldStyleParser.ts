import SldStyleParser from 'geostyler-sld-parser';
import { WellKnownName } from 'geostyler-style';
import GeoserverTextSymbolizer from './GeoserverTextSymbolizer';
import GeoserverMarkSymbolizer from './GeoserverMarkSymbolizer'
var _get = require('lodash.get')

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

var WELLKNOWNNAME_TTF_REGEXP = /^ttf:\/\/(.+)#(.+)$/;

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

/**
   * Get the GeoStyler-Style MarkSymbolizer from an SLD Symbolizer
   *
   * @param {object} sldSymbolizer The SLD Symbolizer
   * @return {MarkSymbolizer} The GeoStyler-Style MarkSymbolizer
   */
  getMarkSymbolizerFromSldSymbolizer(sldSymbolizer: any): GeoserverMarkSymbolizer {
    const wellKnownName: string = _get(sldSymbolizer, 'Graphic[0].Mark[0].WellKnownName[0]');
    let strokeParams: any[] = _get(sldSymbolizer, 'Graphic[0].Mark[0].Stroke[0].CssParameter') || [];
    if (strokeParams.length === 0) {
      strokeParams = _get(sldSymbolizer, 'Graphic[0].Mark[0].Stroke[0].SvgParameter') || [];
    }
    const opacity: string = _get(sldSymbolizer, 'Graphic[0].Opacity[0]');
    const size: string = _get(sldSymbolizer, 'Graphic[0].Size[0]');
    const rotation: string = _get(sldSymbolizer, 'Graphic[0].Rotation[0]');

    let fillParams: any[] = _get(sldSymbolizer, 'Graphic[0].Mark[0].Fill[0].CssParameter') || [];
    if (fillParams.length === 0) {
      fillParams = _get(sldSymbolizer, 'Graphic[0].Mark[0].Fill[0].SvgParameter') || [];
    }
    const colorIdx: number = fillParams.findIndex((cssParam: any) => {
      return cssParam.$.name === 'fill';
    });
    let color: string = _get(sldSymbolizer, 'Graphic[0].Mark[0].Fill[0].CssParameter[' + colorIdx + ']._');
    if (!color) {
      const svg = _get(sldSymbolizer, 'Graphic[0].Mark[0].Fill[0].SvgParameter[' + colorIdx + ']._');
      if (svg) {
        color = svg;
      }
    }

    debugger;var sldFunction = _get(sldSymbolizer, 'Graphic[0].Mark[0].Fill[0].CssParameter[' + colorIdx + '].Function');

    if (sldFunction) {
      console.log('hello world we have made it', sldFunction)
    }

    const fillOpacityIdx: number = fillParams.findIndex((cssParam: any) => {
      return cssParam.$.name === 'fill-opacity';
    });
    let fillOpacity: string = _get(sldSymbolizer,
      'Graphic[0].Mark[0].Fill[0].CssParameter[' + fillOpacityIdx + ']._');
    if (!fillOpacity) {
      fillOpacity = _get(sldSymbolizer,
        'Graphic[0].Mark[0].Fill[0].SvgParameter[' + fillOpacityIdx + ']._');
    }
    const markSymbolizer: GeoserverMarkSymbolizer = {
      kind: 'Mark',
    } as GeoserverMarkSymbolizer;

    if (opacity) {
      markSymbolizer.opacity = parseFloat(opacity);
    }
    if (fillOpacity) {
      markSymbolizer.fillOpacity = parseFloat(fillOpacity);
    }
    if (color) {
      markSymbolizer.color = color;
    }
    if (rotation) {
      markSymbolizer.rotate = parseFloat(rotation);
    }
    if (size) {
      markSymbolizer.radius = parseFloat(size) / 2;
    }

    switch (wellKnownName) {
      case 'circle':
      case 'square':
      case 'triangle':
      case 'star':
      case 'cross':
      case 'x':
        const wkn = wellKnownName.charAt(0).toUpperCase() + wellKnownName.slice(1);
        markSymbolizer.wellKnownName = wkn as WellKnownName;
        break;
      case 'shape://vertline':
      case 'shape://horline':
      case 'shape://slash':
      case 'shape://backslash':
      case 'shape://dot':
      case 'shape://plus':
      case 'shape://times':
      case 'shape://oarrow':
      case 'shape://carrow':
        markSymbolizer.wellKnownName = wellKnownName as WellKnownName;
        break;
      default:
        if (WELLKNOWNNAME_TTF_REGEXP.test(wellKnownName)) {
          markSymbolizer.wellKnownName = wellKnownName as WellKnownName;
          break;
        }
        throw new Error('MarkSymbolizer cannot be parsed. Unsupported WellKnownName.');
    }

    strokeParams.forEach((param: any) => {
      switch (param.$.name) {
        case 'stroke':
          markSymbolizer.strokeColor = param._;
          break;
        case 'stroke-width':
          markSymbolizer.strokeWidth = parseFloat(param._);
          break;
        case 'stroke-opacity':
          markSymbolizer.strokeOpacity = parseFloat(param._);
          break;
        default:
          break;
      }
    });

    return markSymbolizer;
  }
}

export default GeoserverSldStyleParser;
