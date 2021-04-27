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

    var sldFunction = _get(sldSymbolizer, 'Graphic[0].Mark[0].Fill[0].CssParameter[' + colorIdx + '].Function');

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

    if (sldFunction) {
      if (sldFunction[0].$.name === 'Interpolate') {
        const perChunk = 2 // items per chunk

        var newArray = sldFunction[0].Literal.reduce((resultArray: any, item: any, index: any) => { 
          const chunkIndex = Math.floor(index/perChunk)

          if(!resultArray[chunkIndex]) {
            resultArray[chunkIndex] = [] // start a new chunk
          }
          resultArray[chunkIndex].push(item)

          return resultArray
        }, [])
  
        const functionArray = [
          sldFunction[0].$.name,
          sldFunction[0].PropertyName[0],
          newArray
        ]
  
        markSymbolizer.func = functionArray
      }
    }

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

  /**
   * Get the SLD Object (readable with xml2js) from an GeoStyler-Style MarkSymbolizer.
   *
   * @param {MarkSymbolizer} markSymbolizer A GeoStyler-Style MarkSymbolizer.
   * @return {object} The object representation of a SLD PointSymbolizer with a
   * Mark (readable with xml2js)
   */
   getSldPointSymbolizerFromMarkSymbolizer(markSymbolizer: GeoserverMarkSymbolizer): any {
    const isFontSymbol = WELLKNOWNNAME_TTF_REGEXP.test(markSymbolizer.wellKnownName);
    const mark: any[] = [{
      'WellKnownName': [
        isFontSymbol ? markSymbolizer.wellKnownName : markSymbolizer.wellKnownName.toLowerCase()
      ]
    }];


    if (markSymbolizer.color || markSymbolizer.fillOpacity) {
      const cssParameters = [];
      if (markSymbolizer.color) {
        cssParameters.push({
          '_': markSymbolizer.color,
          '$': {
            'name': 'fill'
          }
        });
      }
      if (markSymbolizer.fillOpacity) {
        cssParameters.push({
          '_': markSymbolizer.fillOpacity,
          '$': {
            'name': 'fill-opacity'
          }
        });
      }
      mark[0].Fill = [{
        'CssParameter': cssParameters
      }];
    }

    if (markSymbolizer.strokeColor || markSymbolizer.strokeWidth || markSymbolizer.strokeOpacity) {
      mark[0].Stroke = [{}];
      const strokeCssParameters = [];
      if (markSymbolizer.strokeColor) {
        strokeCssParameters.push({
          '_': markSymbolizer.strokeColor,
          '$': {
            'name': 'stroke'
          }
        });
      }
      if (markSymbolizer.strokeWidth) {
        strokeCssParameters.push({
          '_': markSymbolizer.strokeWidth.toString(),
          '$': {
            'name': 'stroke-width'
          }
        });
      }
      if (markSymbolizer.strokeOpacity) {
        strokeCssParameters.push({
          '_': markSymbolizer.strokeOpacity.toString(),
          '$': {
            'name': 'stroke-opacity'
          }
        });
      }

      mark[0].Stroke[0].CssParameter = strokeCssParameters;
    }

    if (markSymbolizer.func) {
      const emptyArray: string[] = []
      markSymbolizer.func[2].map((arr: string[]) => {
        emptyArray.push(...arr)
      })
      const cssParameters = [];

      if (markSymbolizer.func[0] === 'Interpolate') {
        cssParameters.push({
          '$': {
            'name': 'fill'
          },
          'Function': {
            '$': { 'name': markSymbolizer.func[0] },
            'PropertyName': [markSymbolizer.func[1]],
            'Literal': emptyArray
          }
        });
      }

      mark[0].Fill = [{
        'CssParameter': cssParameters
      }];
    }

    const graphic: any[] = [{
      'Mark': mark
    }];

    if (markSymbolizer.opacity) {
      graphic[0].Opacity = [markSymbolizer.opacity.toString()];
    }

    if (markSymbolizer.radius) {
      graphic[0].Size = [(markSymbolizer.radius * 2).toString()];
    }

    if (markSymbolizer.rotate) {
      graphic[0].Rotation = [markSymbolizer.rotate.toString()];
    }

    return {
      'PointSymbolizer': [{
        'Graphic': graphic
      }]
    };
  }
}

export default GeoserverSldStyleParser;
