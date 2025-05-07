"use strict";
var __defProp = Object.defineProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var _a, _info, _artifacts, _instances, _selected, _elements, _component, _start, _actual, _end, _total, _step2, _baseURL, _personal_token;
Object.defineProperties(exports, { __esModule: { value: true }, [Symbol.toStringTag]: { value: "Module" } });
const obsidian = require("obsidian");
const EACH_ITEM_REACTIVE = 1;
const EACH_INDEX_REACTIVE = 1 << 1;
const EACH_IS_CONTROLLED = 1 << 2;
const EACH_IS_ANIMATED = 1 << 3;
const EACH_ITEM_IMMUTABLE = 1 << 4;
const PROPS_IS_IMMUTABLE = 1;
const PROPS_IS_RUNES = 1 << 1;
const PROPS_IS_UPDATED = 1 << 2;
const PROPS_IS_BINDABLE = 1 << 3;
const PROPS_IS_LAZY_INITIAL = 1 << 4;
const TEMPLATE_FRAGMENT = 1;
const TEMPLATE_USE_IMPORT_NODE = 1 << 1;
const UNINITIALIZED = Symbol();
const NAMESPACE_SVG = "http://www.w3.org/2000/svg";
function rangeContains(range, index2) {
  return range.start <= index2 && index2 < range.end;
}
function getLocator(source2, options = {}) {
  const { offsetLine = 0, offsetColumn = 0 } = options;
  let start = 0;
  const ranges = source2.split("\n").map((line, i2) => {
    const end = start + line.length + 1;
    const range = { start, end, line: i2 };
    start = end;
    return range;
  });
  let i = 0;
  function locator2(search, index2) {
    if (typeof search === "string") {
      search = source2.indexOf(search, index2 ?? 0);
    }
    if (search === -1) return void 0;
    let range = ranges[i];
    const d2 = search >= range.end ? 1 : -1;
    while (range) {
      if (rangeContains(range, search)) {
        return {
          line: offsetLine + range.line,
          column: offsetColumn + search - range.start,
          character: search
        };
      }
      i += d2;
      range = ranges[i];
    }
  }
  return locator2;
}
let source$1;
let locator = getLocator("", { offsetLine: 1 });
let warning_filter;
let ignore_stack = [];
let ignore_map = /* @__PURE__ */ new Map();
const regex_tabs = /^\t+/;
function tabs_to_spaces(str) {
  return str.replace(regex_tabs, (match) => match.split("	").join("  "));
}
function get_code_frame(source2, line, column) {
  const lines = source2.split("\n");
  const frame_start = Math.max(0, line - 2);
  const frame_end = Math.min(line + 3, lines.length);
  const digits = String(frame_end + 1).length;
  return lines.slice(frame_start, frame_end).map((str, i) => {
    const is_error_line = frame_start + i === line;
    const line_num = String(i + frame_start + 1).padStart(digits, " ");
    if (is_error_line) {
      const indicator = " ".repeat(digits + 2 + tabs_to_spaces(str.slice(0, column)).length) + "^";
      return `${line_num}: ${tabs_to_spaces(str)}
${indicator}`;
    }
    return `${line_num}: ${tabs_to_spaces(str)}`;
  }).join("\n");
}
class CompileDiagnostic {
  /**
   * @param {string} code
   * @param {string} message
   * @param {[number, number] | undefined} position
   */
  constructor(code, message, position) {
    __publicField(this, "name", "CompileDiagnostic");
    this.code = code;
    this.message = message;
    if (position) {
      this.position = position;
      this.start = locator(position[0]);
      this.end = locator(position[1]);
      if (this.start && this.end) {
        this.frame = get_code_frame(source$1, this.start.line - 1, this.end.column);
      }
    }
  }
  toString() {
    let out = `${this.code}: ${this.message}`;
    if (this.filename) {
      out += `
${this.filename}`;
      if (this.start) {
        out += `:${this.start.line}:${this.start.column}`;
      }
    }
    if (this.frame) {
      out += `
${this.frame}`;
    }
    return out;
  }
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      filename: this.filename,
      start: this.start,
      end: this.end,
      position: this.position,
      frame: this.frame
    };
  }
}
class InternalCompileWarning extends CompileDiagnostic {
  /**
   * @param {string} code
   * @param {string} message
   * @param {[number, number] | undefined} position
   */
  constructor(code, message, position) {
    super(code, message, position);
    __publicField(this, "name", "CompileWarning");
  }
}
function w$1(node, code, message) {
  var _a2;
  let stack = ignore_stack;
  if (node) {
    stack = ignore_map.get(node) ?? ignore_stack;
  }
  if (stack && ((_a2 = stack.at(-1)) == null ? void 0 : _a2.has(code))) return;
  const warning = new InternalCompileWarning(code, message, node && node.start !== void 0 ? [node.start, node.end ?? node.start] : void 0);
  if (!warning_filter(warning)) return;
}
function options_deprecated_accessors(node) {
  w$1(node, "options_deprecated_accessors", "The `accessors` option has been deprecated. It will have no effect in runes mode");
}
function options_deprecated_immutable(node) {
  w$1(node, "options_deprecated_immutable", "The `immutable` option has been deprecated. It will have no effect in runes mode");
}
function options_removed_enable_sourcemap(node) {
  w$1(node, "options_removed_enable_sourcemap", "The `enableSourcemap` option has been removed. Source maps are always generated now, and tooling can choose to ignore them");
}
function options_removed_hydratable(node) {
  w$1(node, "options_removed_hydratable", "The `hydratable` option has been removed. Svelte components are always hydratable now");
}
function options_removed_loop_guard_timeout(node) {
  w$1(node, "options_removed_loop_guard_timeout", "The `loopGuardTimeout` option has been removed");
}
function options_renamed_ssr_dom(node) {
  w$1(node, "options_renamed_ssr_dom", '`generate: "dom"` and `generate: "ssr"` options have been renamed to "client" and "server" respectively');
}
var astralIdentifierCodes = [509, 0, 227, 0, 150, 4, 294, 9, 1368, 2, 2, 1, 6, 3, 41, 2, 5, 0, 166, 1, 574, 3, 9, 9, 7, 9, 32, 4, 318, 1, 80, 3, 71, 10, 50, 3, 123, 2, 54, 14, 32, 10, 3, 1, 11, 3, 46, 10, 8, 0, 46, 9, 7, 2, 37, 13, 2, 9, 6, 1, 45, 0, 13, 2, 49, 13, 9, 3, 2, 11, 83, 11, 7, 0, 3, 0, 158, 11, 6, 9, 7, 3, 56, 1, 2, 6, 3, 1, 3, 2, 10, 0, 11, 1, 3, 6, 4, 4, 68, 8, 2, 0, 3, 0, 2, 3, 2, 4, 2, 0, 15, 1, 83, 17, 10, 9, 5, 0, 82, 19, 13, 9, 214, 6, 3, 8, 28, 1, 83, 16, 16, 9, 82, 12, 9, 9, 7, 19, 58, 14, 5, 9, 243, 14, 166, 9, 71, 5, 2, 1, 3, 3, 2, 0, 2, 1, 13, 9, 120, 6, 3, 6, 4, 0, 29, 9, 41, 6, 2, 3, 9, 0, 10, 10, 47, 15, 343, 9, 54, 7, 2, 7, 17, 9, 57, 21, 2, 13, 123, 5, 4, 0, 2, 1, 2, 6, 2, 0, 9, 9, 49, 4, 2, 1, 2, 4, 9, 9, 330, 3, 10, 1, 2, 0, 49, 6, 4, 4, 14, 10, 5350, 0, 7, 14, 11465, 27, 2343, 9, 87, 9, 39, 4, 60, 6, 26, 9, 535, 9, 470, 0, 2, 54, 8, 3, 82, 0, 12, 1, 19628, 1, 4178, 9, 519, 45, 3, 22, 543, 4, 4, 5, 9, 7, 3, 6, 31, 3, 149, 2, 1418, 49, 513, 54, 5, 49, 9, 0, 15, 0, 23, 4, 2, 14, 1361, 6, 2, 16, 3, 6, 2, 1, 2, 4, 101, 0, 161, 6, 10, 9, 357, 0, 62, 13, 499, 13, 245, 1, 2, 9, 726, 6, 110, 6, 6, 9, 4759, 9, 787719, 239];
var astralIdentifierStartCodes = [0, 11, 2, 25, 2, 18, 2, 1, 2, 14, 3, 13, 35, 122, 70, 52, 268, 28, 4, 48, 48, 31, 14, 29, 6, 37, 11, 29, 3, 35, 5, 7, 2, 4, 43, 157, 19, 35, 5, 35, 5, 39, 9, 51, 13, 10, 2, 14, 2, 6, 2, 1, 2, 10, 2, 14, 2, 6, 2, 1, 4, 51, 13, 310, 10, 21, 11, 7, 25, 5, 2, 41, 2, 8, 70, 5, 3, 0, 2, 43, 2, 1, 4, 0, 3, 22, 11, 22, 10, 30, 66, 18, 2, 1, 11, 21, 11, 25, 71, 55, 7, 1, 65, 0, 16, 3, 2, 2, 2, 28, 43, 28, 4, 28, 36, 7, 2, 27, 28, 53, 11, 21, 11, 18, 14, 17, 111, 72, 56, 50, 14, 50, 14, 35, 39, 27, 10, 22, 251, 41, 7, 1, 17, 2, 60, 28, 11, 0, 9, 21, 43, 17, 47, 20, 28, 22, 13, 52, 58, 1, 3, 0, 14, 44, 33, 24, 27, 35, 30, 0, 3, 0, 9, 34, 4, 0, 13, 47, 15, 3, 22, 0, 2, 0, 36, 17, 2, 24, 20, 1, 64, 6, 2, 0, 2, 3, 2, 14, 2, 9, 8, 46, 39, 7, 3, 1, 3, 21, 2, 6, 2, 1, 2, 4, 4, 0, 19, 0, 13, 4, 31, 9, 2, 0, 3, 0, 2, 37, 2, 0, 26, 0, 2, 0, 45, 52, 19, 3, 21, 2, 31, 47, 21, 1, 2, 0, 185, 46, 42, 3, 37, 47, 21, 0, 60, 42, 14, 0, 72, 26, 38, 6, 186, 43, 117, 63, 32, 7, 3, 0, 3, 7, 2, 1, 2, 23, 16, 0, 2, 0, 95, 7, 3, 38, 17, 0, 2, 0, 29, 0, 11, 39, 8, 0, 22, 0, 12, 45, 20, 0, 19, 72, 200, 32, 32, 8, 2, 36, 18, 0, 50, 29, 113, 6, 2, 1, 2, 37, 22, 0, 26, 5, 2, 1, 2, 31, 15, 0, 328, 18, 16, 0, 2, 12, 2, 33, 125, 0, 80, 921, 103, 110, 18, 195, 2637, 96, 16, 1071, 18, 5, 26, 3994, 6, 582, 6842, 29, 1763, 568, 8, 30, 18, 78, 18, 29, 19, 47, 17, 3, 32, 20, 6, 18, 433, 44, 212, 63, 129, 74, 6, 0, 67, 12, 65, 1, 2, 0, 29, 6135, 9, 1237, 42, 9, 8936, 3, 2, 6, 2, 1, 2, 290, 16, 0, 30, 2, 3, 0, 15, 3, 9, 395, 2309, 106, 6, 12, 4, 8, 8, 9, 5991, 84, 2, 70, 2, 1, 3, 0, 3, 1, 3, 3, 2, 11, 2, 0, 2, 6, 2, 64, 2, 3, 3, 7, 2, 6, 2, 27, 2, 3, 2, 4, 2, 0, 4, 6, 2, 339, 3, 24, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 7, 1845, 30, 7, 5, 262, 61, 147, 44, 11, 6, 17, 0, 322, 29, 19, 43, 485, 27, 229, 29, 3, 0, 496, 6, 2, 3, 2, 1, 2, 14, 2, 196, 60, 67, 8, 0, 1205, 3, 2, 26, 2, 1, 2, 0, 3, 0, 2, 9, 2, 3, 2, 0, 2, 0, 7, 0, 5, 0, 2, 0, 2, 0, 2, 2, 2, 1, 2, 0, 3, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 1, 2, 0, 3, 3, 2, 6, 2, 3, 2, 3, 2, 0, 2, 9, 2, 16, 6, 2, 2, 4, 2, 16, 4421, 42719, 33, 4153, 7, 221, 3, 5761, 15, 7472, 16, 621, 2467, 541, 1507, 4938, 6, 4191];
var nonASCIIidentifierChars = "‌‍·̀-ͯ·҃-֑҇-ׇֽֿׁׂׅׄؐ-ًؚ-٩ٰۖ-ۜ۟-۪ۤۧۨ-ۭ۰-۹ܑܰ-݊ަ-ް߀-߉߫-߽߳ࠖ-࠙ࠛ-ࠣࠥ-ࠧࠩ-࡙࠭-࡛ࢗ-࢟࣊-ࣣ࣡-ःऺ-़ा-ॏ॑-ॗॢॣ०-९ঁ-ঃ়া-ৄেৈো-্ৗৢৣ০-৯৾ਁ-ਃ਼ਾ-ੂੇੈੋ-੍ੑ੦-ੱੵઁ-ઃ઼ા-ૅે-ૉો-્ૢૣ૦-૯ૺ-૿ଁ-ଃ଼ା-ୄେୈୋ-୍୕-ୗୢୣ୦-୯ஂா-ூெ-ைொ-்ௗ௦-௯ఀ-ఄ఼ా-ౄె-ైొ-్ౕౖౢౣ౦-౯ಁ-ಃ಼ಾ-ೄೆ-ೈೊ-್ೕೖೢೣ೦-೯ೳഀ-ഃ഻഼ാ-ൄെ-ൈൊ-്ൗൢൣ൦-൯ඁ-ඃ්ා-ුූෘ-ෟ෦-෯ෲෳัิ-ฺ็-๎๐-๙ັິ-ຼ່-໎໐-໙༘༙༠-༩༹༵༷༾༿ཱ-྄྆྇ྍ-ྗྙ-ྼ࿆ါ-ှ၀-၉ၖ-ၙၞ-ၠၢ-ၤၧ-ၭၱ-ၴႂ-ႍႏ-ႝ፝-፟፩-፱ᜒ-᜕ᜲ-᜴ᝒᝓᝲᝳ឴-៓៝០-៩᠋-᠍᠏-᠙ᢩᤠ-ᤫᤰ-᤻᥆-᥏᧐-᧚ᨗ-ᨛᩕ-ᩞ᩠-᩿᩼-᪉᪐-᪙᪰-᪽ᪿ-ᫎᬀ-ᬄ᬴-᭄᭐-᭙᭫-᭳ᮀ-ᮂᮡ-ᮭ᮰-᮹᯦-᯳ᰤ-᰷᱀-᱉᱐-᱙᳐-᳔᳒-᳨᳭᳴᳷-᳹᷀-᷿‌‍‿⁀⁔⃐-⃥⃜⃡-⃰⳯-⵿⳱ⷠ-〪ⷿ-゙゚〯・꘠-꘩꙯ꙴ-꙽ꚞꚟ꛰꛱ꠂ꠆ꠋꠣ-ꠧ꠬ꢀꢁꢴ-ꣅ꣐-꣙꣠-꣱ꣿ-꤉ꤦ-꤭ꥇ-꥓ꦀ-ꦃ꦳-꧀꧐-꧙ꧥ꧰-꧹ꨩ-ꨶꩃꩌꩍ꩐-꩙ꩻ-ꩽꪰꪲ-ꪴꪷꪸꪾ꪿꫁ꫫ-ꫯꫵ꫶ꯣ-ꯪ꯬꯭꯰-꯹ﬞ︀-️︠-︯︳︴﹍-﹏０-９＿･";
var nonASCIIidentifierStartChars = "ªµºÀ-ÖØ-öø-ˁˆ-ˑˠ-ˤˬˮͰ-ʹͶͷͺ-ͽͿΆΈ-ΊΌΎ-ΡΣ-ϵϷ-ҁҊ-ԯԱ-Ֆՙՠ-ֈא-תׯ-ײؠ-يٮٯٱ-ۓەۥۦۮۯۺ-ۼۿܐܒ-ܯݍ-ޥޱߊ-ߪߴߵߺࠀ-ࠕࠚࠤࠨࡀ-ࡘࡠ-ࡪࡰ-ࢇࢉ-ࢎࢠ-ࣉऄ-हऽॐक़-ॡॱ-ঀঅ-ঌএঐও-নপ-রলশ-হঽৎড়ঢ়য়-ৡৰৱৼਅ-ਊਏਐਓ-ਨਪ-ਰਲਲ਼ਵਸ਼ਸਹਖ਼-ੜਫ਼ੲ-ੴઅ-ઍએ-ઑઓ-નપ-રલળવ-હઽૐૠૡૹଅ-ଌଏଐଓ-ନପ-ରଲଳଵ-ହଽଡ଼ଢ଼ୟ-ୡୱஃஅ-ஊஎ-ஐஒ-கஙசஜஞடணதந-பம-ஹௐఅ-ఌఎ-ఐఒ-నప-హఽౘ-ౚౝౠౡಀಅ-ಌಎ-ಐಒ-ನಪ-ಳವ-ಹಽೝೞೠೡೱೲഄ-ഌഎ-ഐഒ-ഺഽൎൔ-ൖൟ-ൡൺ-ൿඅ-ඖක-නඳ-රලව-ෆก-ะาำเ-ๆກຂຄຆ-ຊຌ-ຣລວ-ະາຳຽເ-ໄໆໜ-ໟༀཀ-ཇཉ-ཬྈ-ྌက-ဪဿၐ-ၕၚ-ၝၡၥၦၮ-ၰၵ-ႁႎႠ-ჅჇჍა-ჺჼ-ቈቊ-ቍቐ-ቖቘቚ-ቝበ-ኈኊ-ኍነ-ኰኲ-ኵኸ-ኾዀዂ-ዅወ-ዖዘ-ጐጒ-ጕጘ-ፚᎀ-ᎏᎠ-Ᏽᏸ-ᏽᐁ-ᙬᙯ-ᙿᚁ-ᚚᚠ-ᛪᛮ-ᛸᜀ-ᜑᜟ-ᜱᝀ-ᝑᝠ-ᝬᝮ-ᝰក-ឳៗៜᠠ-ᡸᢀ-ᢨᢪᢰ-ᣵᤀ-ᤞᥐ-ᥭᥰ-ᥴᦀ-ᦫᦰ-ᧉᨀ-ᨖᨠ-ᩔᪧᬅ-ᬳᭅ-ᭌᮃ-ᮠᮮᮯᮺ-ᯥᰀ-ᰣᱍ-ᱏᱚ-ᱽᲀ-ᲊᲐ-ᲺᲽ-Ჿᳩ-ᳬᳮ-ᳳᳵᳶᳺᴀ-ᶿḀ-ἕἘ-Ἕἠ-ὅὈ-Ὅὐ-ὗὙὛὝὟ-ώᾀ-ᾴᾶ-ᾼιῂ-ῄῆ-ῌῐ-ΐῖ-Ίῠ-Ῥῲ-ῴῶ-ῼⁱⁿₐ-ₜℂℇℊ-ℓℕ℘-ℝℤΩℨK-ℹℼ-ℿⅅ-ⅉⅎⅠ-ↈⰀ-ⳤⳫ-ⳮⳲⳳⴀ-ⴥⴧⴭⴰ-ⵧⵯⶀ-ⶖⶠ-ⶦⶨ-ⶮⶰ-ⶶⶸ-ⶾⷀ-ⷆⷈ-ⷎⷐ-ⷖⷘ-ⷞ々-〇〡-〩〱-〵〸-〼ぁ-ゖ゛-ゟァ-ヺー-ヿㄅ-ㄯㄱ-ㆎㆠ-ㆿㇰ-ㇿ㐀-䶿一-ꒌꓐ-ꓽꔀ-ꘌꘐ-ꘟꘪꘫꙀ-ꙮꙿ-ꚝꚠ-ꛯꜗ-ꜟꜢ-ꞈꞋ-ꟍꟐꟑꟓꟕ-Ƛꟲ-ꠁꠃ-ꠅꠇ-ꠊꠌ-ꠢꡀ-ꡳꢂ-ꢳꣲ-ꣷꣻꣽꣾꤊ-ꤥꤰ-ꥆꥠ-ꥼꦄ-ꦲꧏꧠ-ꧤꧦ-ꧯꧺ-ꧾꨀ-ꨨꩀ-ꩂꩄ-ꩋꩠ-ꩶꩺꩾ-ꪯꪱꪵꪶꪹ-ꪽꫀꫂꫛ-ꫝꫠ-ꫪꫲ-ꫴꬁ-ꬆꬉ-ꬎꬑ-ꬖꬠ-ꬦꬨ-ꬮꬰ-ꭚꭜ-ꭩꭰ-ꯢ가-힣ힰ-ퟆퟋ-ퟻ豈-舘並-龎ﬀ-ﬆﬓ-ﬗיִײַ-ﬨשׁ-זּטּ-לּמּנּסּףּפּצּ-ﮱﯓ-ﴽﵐ-ﶏﶒ-ﷇﷰ-ﷻﹰ-ﹴﹶ-ﻼＡ-Ｚａ-ｚｦ-ﾾￂ-ￇￊ-ￏￒ-ￗￚ-ￜ";
var reservedWords = {
  3: "abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile",
  5: "class enum extends super const export import",
  6: "enum",
  strict: "implements interface let package private protected public static yield",
  strictBind: "eval arguments"
};
var ecma5AndLessKeywords = "break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this";
var keywords$1 = {
  5: ecma5AndLessKeywords,
  "5module": ecma5AndLessKeywords + " export import",
  6: ecma5AndLessKeywords + " const class extends export import super"
};
var keywordRelationalOperator = /^in(stanceof)?$/;
var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");
function isInAstralSet(code, set2) {
  var pos = 65536;
  for (var i = 0; i < set2.length; i += 2) {
    pos += set2[i];
    if (pos > code) {
      return false;
    }
    pos += set2[i + 1];
    if (pos >= code) {
      return true;
    }
  }
  return false;
}
function isIdentifierStart(code, astral) {
  if (code < 65) {
    return code === 36;
  }
  if (code < 91) {
    return true;
  }
  if (code < 97) {
    return code === 95;
  }
  if (code < 123) {
    return true;
  }
  if (code <= 65535) {
    return code >= 170 && nonASCIIidentifierStart.test(String.fromCharCode(code));
  }
  if (astral === false) {
    return false;
  }
  return isInAstralSet(code, astralIdentifierStartCodes);
}
function isIdentifierChar(code, astral) {
  if (code < 48) {
    return code === 36;
  }
  if (code < 58) {
    return true;
  }
  if (code < 65) {
    return false;
  }
  if (code < 91) {
    return true;
  }
  if (code < 97) {
    return code === 95;
  }
  if (code < 123) {
    return true;
  }
  if (code <= 65535) {
    return code >= 170 && nonASCIIidentifier.test(String.fromCharCode(code));
  }
  if (astral === false) {
    return false;
  }
  return isInAstralSet(code, astralIdentifierStartCodes) || isInAstralSet(code, astralIdentifierCodes);
}
var TokenType = function TokenType2(label, conf) {
  if (conf === void 0) conf = {};
  this.label = label;
  this.keyword = conf.keyword;
  this.beforeExpr = !!conf.beforeExpr;
  this.startsExpr = !!conf.startsExpr;
  this.isLoop = !!conf.isLoop;
  this.isAssign = !!conf.isAssign;
  this.prefix = !!conf.prefix;
  this.postfix = !!conf.postfix;
  this.binop = conf.binop || null;
  this.updateContext = null;
};
function binop(name, prec) {
  return new TokenType(name, { beforeExpr: true, binop: prec });
}
var beforeExpr = { beforeExpr: true }, startsExpr = { startsExpr: true };
var keywords = {};
function kw(name, options) {
  if (options === void 0) options = {};
  options.keyword = name;
  return keywords[name] = new TokenType(name, options);
}
var types$1 = {
  num: new TokenType("num", startsExpr),
  regexp: new TokenType("regexp", startsExpr),
  string: new TokenType("string", startsExpr),
  name: new TokenType("name", startsExpr),
  privateId: new TokenType("privateId", startsExpr),
  eof: new TokenType("eof"),
  // Punctuation token types.
  bracketL: new TokenType("[", { beforeExpr: true, startsExpr: true }),
  bracketR: new TokenType("]"),
  braceL: new TokenType("{", { beforeExpr: true, startsExpr: true }),
  braceR: new TokenType("}"),
  parenL: new TokenType("(", { beforeExpr: true, startsExpr: true }),
  parenR: new TokenType(")"),
  comma: new TokenType(",", beforeExpr),
  semi: new TokenType(";", beforeExpr),
  colon: new TokenType(":", beforeExpr),
  dot: new TokenType("."),
  question: new TokenType("?", beforeExpr),
  questionDot: new TokenType("?."),
  arrow: new TokenType("=>", beforeExpr),
  template: new TokenType("template"),
  invalidTemplate: new TokenType("invalidTemplate"),
  ellipsis: new TokenType("...", beforeExpr),
  backQuote: new TokenType("`", startsExpr),
  dollarBraceL: new TokenType("${", { beforeExpr: true, startsExpr: true }),
  // Operators. These carry several kinds of properties to help the
  // parser use them properly (the presence of these properties is
  // what categorizes them as operators).
  //
  // `binop`, when present, specifies that this operator is a binary
  // operator, and will refer to its precedence.
  //
  // `prefix` and `postfix` mark the operator as a prefix or postfix
  // unary operator.
  //
  // `isAssign` marks all of `=`, `+=`, `-=` etcetera, which act as
  // binary operators with a very low precedence, that should result
  // in AssignmentExpression nodes.
  eq: new TokenType("=", { beforeExpr: true, isAssign: true }),
  assign: new TokenType("_=", { beforeExpr: true, isAssign: true }),
  incDec: new TokenType("++/--", { prefix: true, postfix: true, startsExpr: true }),
  prefix: new TokenType("!/~", { beforeExpr: true, prefix: true, startsExpr: true }),
  logicalOR: binop("||", 1),
  logicalAND: binop("&&", 2),
  bitwiseOR: binop("|", 3),
  bitwiseXOR: binop("^", 4),
  bitwiseAND: binop("&", 5),
  equality: binop("==/!=/===/!==", 6),
  relational: binop("</>/<=/>=", 7),
  bitShift: binop("<</>>/>>>", 8),
  plusMin: new TokenType("+/-", { beforeExpr: true, binop: 9, prefix: true, startsExpr: true }),
  modulo: binop("%", 10),
  star: binop("*", 10),
  slash: binop("/", 10),
  starstar: new TokenType("**", { beforeExpr: true }),
  coalesce: binop("??", 1),
  // Keyword token types.
  _break: kw("break"),
  _case: kw("case", beforeExpr),
  _catch: kw("catch"),
  _continue: kw("continue"),
  _debugger: kw("debugger"),
  _default: kw("default", beforeExpr),
  _do: kw("do", { isLoop: true, beforeExpr: true }),
  _else: kw("else", beforeExpr),
  _finally: kw("finally"),
  _for: kw("for", { isLoop: true }),
  _function: kw("function", startsExpr),
  _if: kw("if"),
  _return: kw("return", beforeExpr),
  _switch: kw("switch"),
  _throw: kw("throw", beforeExpr),
  _try: kw("try"),
  _var: kw("var"),
  _const: kw("const"),
  _while: kw("while", { isLoop: true }),
  _with: kw("with"),
  _new: kw("new", { beforeExpr: true, startsExpr: true }),
  _this: kw("this", startsExpr),
  _super: kw("super", startsExpr),
  _class: kw("class", startsExpr),
  _extends: kw("extends", beforeExpr),
  _export: kw("export"),
  _import: kw("import", startsExpr),
  _null: kw("null", startsExpr),
  _true: kw("true", startsExpr),
  _false: kw("false", startsExpr),
  _in: kw("in", { beforeExpr: true, binop: 7 }),
  _instanceof: kw("instanceof", { beforeExpr: true, binop: 7 }),
  _typeof: kw("typeof", { beforeExpr: true, prefix: true, startsExpr: true }),
  _void: kw("void", { beforeExpr: true, prefix: true, startsExpr: true }),
  _delete: kw("delete", { beforeExpr: true, prefix: true, startsExpr: true })
};
var lineBreak = /\r\n?|\n|\u2028|\u2029/;
var lineBreakG = new RegExp(lineBreak.source, "g");
function isNewLine(code) {
  return code === 10 || code === 13 || code === 8232 || code === 8233;
}
function nextLineBreak(code, from, end) {
  if (end === void 0) end = code.length;
  for (var i = from; i < end; i++) {
    var next = code.charCodeAt(i);
    if (isNewLine(next)) {
      return i < end - 1 && next === 13 && code.charCodeAt(i + 1) === 10 ? i + 2 : i + 1;
    }
  }
  return -1;
}
var nonASCIIwhitespace = /[\u1680\u2000-\u200a\u202f\u205f\u3000\ufeff]/;
var skipWhiteSpace = /(?:\s|\/\/.*|\/\*[^]*?\*\/)*/g;
var ref = Object.prototype;
var hasOwnProperty = ref.hasOwnProperty;
var toString = ref.toString;
var hasOwn = Object.hasOwn || function(obj, propName) {
  return hasOwnProperty.call(obj, propName);
};
var isArray = Array.isArray || function(obj) {
  return toString.call(obj) === "[object Array]";
};
var regexpCache = /* @__PURE__ */ Object.create(null);
function wordsRegexp(words) {
  return regexpCache[words] || (regexpCache[words] = new RegExp("^(?:" + words.replace(/ /g, "|") + ")$"));
}
function codePointToString(code) {
  if (code <= 65535) {
    return String.fromCharCode(code);
  }
  code -= 65536;
  return String.fromCharCode((code >> 10) + 55296, (code & 1023) + 56320);
}
var loneSurrogate = /(?:[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/;
var Position = function Position2(line, col) {
  this.line = line;
  this.column = col;
};
Position.prototype.offset = function offset(n2) {
  return new Position(this.line, this.column + n2);
};
var SourceLocation = function SourceLocation2(p2, start, end) {
  this.start = start;
  this.end = end;
  if (p2.sourceFile !== null) {
    this.source = p2.sourceFile;
  }
};
function getLineInfo(input, offset2) {
  for (var line = 1, cur = 0; ; ) {
    var nextBreak = nextLineBreak(input, cur, offset2);
    if (nextBreak < 0) {
      return new Position(line, offset2 - cur);
    }
    ++line;
    cur = nextBreak;
  }
}
var defaultOptions = {
  // `ecmaVersion` indicates the ECMAScript version to parse. Must be
  // either 3, 5, 6 (or 2015), 7 (2016), 8 (2017), 9 (2018), 10
  // (2019), 11 (2020), 12 (2021), 13 (2022), 14 (2023), or `"latest"`
  // (the latest version the library supports). This influences
  // support for strict mode, the set of reserved words, and support
  // for new syntax features.
  ecmaVersion: null,
  // `sourceType` indicates the mode the code should be parsed in.
  // Can be either `"script"` or `"module"`. This influences global
  // strict mode and parsing of `import` and `export` declarations.
  sourceType: "script",
  // `onInsertedSemicolon` can be a callback that will be called when
  // a semicolon is automatically inserted. It will be passed the
  // position of the inserted semicolon as an offset, and if
  // `locations` is enabled, it is given the location as a `{line,
  // column}` object as second argument.
  onInsertedSemicolon: null,
  // `onTrailingComma` is similar to `onInsertedSemicolon`, but for
  // trailing commas.
  onTrailingComma: null,
  // By default, reserved words are only enforced if ecmaVersion >= 5.
  // Set `allowReserved` to a boolean value to explicitly turn this on
  // an off. When this option has the value "never", reserved words
  // and keywords can also not be used as property names.
  allowReserved: null,
  // When enabled, a return at the top level is not considered an
  // error.
  allowReturnOutsideFunction: false,
  // When enabled, import/export statements are not constrained to
  // appearing at the top of the program, and an import.meta expression
  // in a script isn't considered an error.
  allowImportExportEverywhere: false,
  // By default, await identifiers are allowed to appear at the top-level scope only if ecmaVersion >= 2022.
  // When enabled, await identifiers are allowed to appear at the top-level scope,
  // but they are still not allowed in non-async functions.
  allowAwaitOutsideFunction: null,
  // When enabled, super identifiers are not constrained to
  // appearing in methods and do not raise an error when they appear elsewhere.
  allowSuperOutsideMethod: null,
  // When enabled, hashbang directive in the beginning of file is
  // allowed and treated as a line comment. Enabled by default when
  // `ecmaVersion` >= 2023.
  allowHashBang: false,
  // By default, the parser will verify that private properties are
  // only used in places where they are valid and have been declared.
  // Set this to false to turn such checks off.
  checkPrivateFields: true,
  // When `locations` is on, `loc` properties holding objects with
  // `start` and `end` properties in `{line, column}` form (with
  // line being 1-based and column 0-based) will be attached to the
  // nodes.
  locations: false,
  // A function can be passed as `onToken` option, which will
  // cause Acorn to call that function with object in the same
  // format as tokens returned from `tokenizer().getToken()`. Note
  // that you are not allowed to call the parser from the
  // callback—that will corrupt its internal state.
  onToken: null,
  // A function can be passed as `onComment` option, which will
  // cause Acorn to call that function with `(block, text, start,
  // end)` parameters whenever a comment is skipped. `block` is a
  // boolean indicating whether this is a block (`/* */`) comment,
  // `text` is the content of the comment, and `start` and `end` are
  // character offsets that denote the start and end of the comment.
  // When the `locations` option is on, two more parameters are
  // passed, the full `{line, column}` locations of the start and
  // end of the comments. Note that you are not allowed to call the
  // parser from the callback—that will corrupt its internal state.
  // When this option has an array as value, objects representing the
  // comments are pushed to it.
  onComment: null,
  // Nodes have their start and end characters offsets recorded in
  // `start` and `end` properties (directly on the node, rather than
  // the `loc` object, which holds line/column data. To also add a
  // [semi-standardized][range] `range` property holding a `[start,
  // end]` array with the same numbers, set the `ranges` option to
  // `true`.
  //
  // [range]: https://bugzilla.mozilla.org/show_bug.cgi?id=745678
  ranges: false,
  // It is possible to parse multiple files into a single AST by
  // passing the tree produced by parsing the first file as
  // `program` option in subsequent parses. This will add the
  // toplevel forms of the parsed file to the `Program` (top) node
  // of an existing parse tree.
  program: null,
  // When `locations` is on, you can pass this to record the source
  // file in every node's `loc` object.
  sourceFile: null,
  // This value, if given, is stored in every node, whether
  // `locations` is on or off.
  directSourceFile: null,
  // When enabled, parenthesized expressions are represented by
  // (non-standard) ParenthesizedExpression nodes
  preserveParens: false
};
var warnedAboutEcmaVersion = false;
function getOptions(opts) {
  var options = {};
  for (var opt in defaultOptions) {
    options[opt] = opts && hasOwn(opts, opt) ? opts[opt] : defaultOptions[opt];
  }
  if (options.ecmaVersion === "latest") {
    options.ecmaVersion = 1e8;
  } else if (options.ecmaVersion == null) {
    if (!warnedAboutEcmaVersion && typeof console === "object" && console.warn) {
      warnedAboutEcmaVersion = true;
      console.warn("Since Acorn 8.0.0, options.ecmaVersion is required.\nDefaulting to 2020, but this will stop working in the future.");
    }
    options.ecmaVersion = 11;
  } else if (options.ecmaVersion >= 2015) {
    options.ecmaVersion -= 2009;
  }
  if (options.allowReserved == null) {
    options.allowReserved = options.ecmaVersion < 5;
  }
  if (!opts || opts.allowHashBang == null) {
    options.allowHashBang = options.ecmaVersion >= 14;
  }
  if (isArray(options.onToken)) {
    var tokens = options.onToken;
    options.onToken = function(token) {
      return tokens.push(token);
    };
  }
  if (isArray(options.onComment)) {
    options.onComment = pushComment(options, options.onComment);
  }
  return options;
}
function pushComment(options, array) {
  return function(block2, text2, start, end, startLoc, endLoc) {
    var comment2 = {
      type: block2 ? "Block" : "Line",
      value: text2,
      start,
      end
    };
    if (options.locations) {
      comment2.loc = new SourceLocation(this, startLoc, endLoc);
    }
    if (options.ranges) {
      comment2.range = [start, end];
    }
    array.push(comment2);
  };
}
var SCOPE_TOP = 1, SCOPE_FUNCTION = 2, SCOPE_ASYNC = 4, SCOPE_GENERATOR = 8, SCOPE_ARROW = 16, SCOPE_SIMPLE_CATCH = 32, SCOPE_SUPER = 64, SCOPE_DIRECT_SUPER = 128, SCOPE_CLASS_STATIC_BLOCK = 256, SCOPE_VAR = SCOPE_TOP | SCOPE_FUNCTION | SCOPE_CLASS_STATIC_BLOCK;
function functionFlags(async, generator) {
  return SCOPE_FUNCTION | (async ? SCOPE_ASYNC : 0) | (generator ? SCOPE_GENERATOR : 0);
}
var BIND_NONE = 0, BIND_VAR = 1, BIND_LEXICAL = 2, BIND_FUNCTION = 3, BIND_SIMPLE_CATCH = 4, BIND_OUTSIDE = 5;
var Parser = function Parser2(options, input, startPos) {
  this.options = options = getOptions(options);
  this.sourceFile = options.sourceFile;
  this.keywords = wordsRegexp(keywords$1[options.ecmaVersion >= 6 ? 6 : options.sourceType === "module" ? "5module" : 5]);
  var reserved = "";
  if (options.allowReserved !== true) {
    reserved = reservedWords[options.ecmaVersion >= 6 ? 6 : options.ecmaVersion === 5 ? 5 : 3];
    if (options.sourceType === "module") {
      reserved += " await";
    }
  }
  this.reservedWords = wordsRegexp(reserved);
  var reservedStrict = (reserved ? reserved + " " : "") + reservedWords.strict;
  this.reservedWordsStrict = wordsRegexp(reservedStrict);
  this.reservedWordsStrictBind = wordsRegexp(reservedStrict + " " + reservedWords.strictBind);
  this.input = String(input);
  this.containsEsc = false;
  if (startPos) {
    this.pos = startPos;
    this.lineStart = this.input.lastIndexOf("\n", startPos - 1) + 1;
    this.curLine = this.input.slice(0, this.lineStart).split(lineBreak).length;
  } else {
    this.pos = this.lineStart = 0;
    this.curLine = 1;
  }
  this.type = types$1.eof;
  this.value = null;
  this.start = this.end = this.pos;
  this.startLoc = this.endLoc = this.curPosition();
  this.lastTokEndLoc = this.lastTokStartLoc = null;
  this.lastTokStart = this.lastTokEnd = this.pos;
  this.context = this.initialContext();
  this.exprAllowed = true;
  this.inModule = options.sourceType === "module";
  this.strict = this.inModule || this.strictDirective(this.pos);
  this.potentialArrowAt = -1;
  this.potentialArrowInForAwait = false;
  this.yieldPos = this.awaitPos = this.awaitIdentPos = 0;
  this.labels = [];
  this.undefinedExports = /* @__PURE__ */ Object.create(null);
  if (this.pos === 0 && options.allowHashBang && this.input.slice(0, 2) === "#!") {
    this.skipLineComment(2);
  }
  this.scopeStack = [];
  this.enterScope(SCOPE_TOP);
  this.regexpState = null;
  this.privateNameStack = [];
};
var prototypeAccessors = { inFunction: { configurable: true }, inGenerator: { configurable: true }, inAsync: { configurable: true }, canAwait: { configurable: true }, allowSuper: { configurable: true }, allowDirectSuper: { configurable: true }, treatFunctionsAsVar: { configurable: true }, allowNewDotTarget: { configurable: true }, inClassStaticBlock: { configurable: true } };
Parser.prototype.parse = function parse() {
  var node = this.options.program || this.startNode();
  this.nextToken();
  return this.parseTopLevel(node);
};
prototypeAccessors.inFunction.get = function() {
  return (this.currentVarScope().flags & SCOPE_FUNCTION) > 0;
};
prototypeAccessors.inGenerator.get = function() {
  return (this.currentVarScope().flags & SCOPE_GENERATOR) > 0 && !this.currentVarScope().inClassFieldInit;
};
prototypeAccessors.inAsync.get = function() {
  return (this.currentVarScope().flags & SCOPE_ASYNC) > 0 && !this.currentVarScope().inClassFieldInit;
};
prototypeAccessors.canAwait.get = function() {
  for (var i = this.scopeStack.length - 1; i >= 0; i--) {
    var scope = this.scopeStack[i];
    if (scope.inClassFieldInit || scope.flags & SCOPE_CLASS_STATIC_BLOCK) {
      return false;
    }
    if (scope.flags & SCOPE_FUNCTION) {
      return (scope.flags & SCOPE_ASYNC) > 0;
    }
  }
  return this.inModule && this.options.ecmaVersion >= 13 || this.options.allowAwaitOutsideFunction;
};
prototypeAccessors.allowSuper.get = function() {
  var ref2 = this.currentThisScope();
  var flags = ref2.flags;
  var inClassFieldInit = ref2.inClassFieldInit;
  return (flags & SCOPE_SUPER) > 0 || inClassFieldInit || this.options.allowSuperOutsideMethod;
};
prototypeAccessors.allowDirectSuper.get = function() {
  return (this.currentThisScope().flags & SCOPE_DIRECT_SUPER) > 0;
};
prototypeAccessors.treatFunctionsAsVar.get = function() {
  return this.treatFunctionsAsVarInScope(this.currentScope());
};
prototypeAccessors.allowNewDotTarget.get = function() {
  var ref2 = this.currentThisScope();
  var flags = ref2.flags;
  var inClassFieldInit = ref2.inClassFieldInit;
  return (flags & (SCOPE_FUNCTION | SCOPE_CLASS_STATIC_BLOCK)) > 0 || inClassFieldInit;
};
prototypeAccessors.inClassStaticBlock.get = function() {
  return (this.currentVarScope().flags & SCOPE_CLASS_STATIC_BLOCK) > 0;
};
Parser.extend = function extend() {
  var plugins = [], len = arguments.length;
  while (len--) plugins[len] = arguments[len];
  var cls = this;
  for (var i = 0; i < plugins.length; i++) {
    cls = plugins[i](cls);
  }
  return cls;
};
Parser.parse = function parse2(input, options) {
  return new this(options, input).parse();
};
Parser.parseExpressionAt = function parseExpressionAt(input, pos, options) {
  var parser = new this(options, input, pos);
  parser.nextToken();
  return parser.parseExpression();
};
Parser.tokenizer = function tokenizer(input, options) {
  return new this(options, input);
};
Object.defineProperties(Parser.prototype, prototypeAccessors);
var pp$9 = Parser.prototype;
var literal = /^(?:'((?:\\[^]|[^'\\])*?)'|"((?:\\[^]|[^"\\])*?)")/;
pp$9.strictDirective = function(start) {
  if (this.options.ecmaVersion < 5) {
    return false;
  }
  for (; ; ) {
    skipWhiteSpace.lastIndex = start;
    start += skipWhiteSpace.exec(this.input)[0].length;
    var match = literal.exec(this.input.slice(start));
    if (!match) {
      return false;
    }
    if ((match[1] || match[2]) === "use strict") {
      skipWhiteSpace.lastIndex = start + match[0].length;
      var spaceAfter = skipWhiteSpace.exec(this.input), end = spaceAfter.index + spaceAfter[0].length;
      var next = this.input.charAt(end);
      return next === ";" || next === "}" || lineBreak.test(spaceAfter[0]) && !(/[(`.[+\-/*%<>=,?^&]/.test(next) || next === "!" && this.input.charAt(end + 1) === "=");
    }
    start += match[0].length;
    skipWhiteSpace.lastIndex = start;
    start += skipWhiteSpace.exec(this.input)[0].length;
    if (this.input[start] === ";") {
      start++;
    }
  }
};
pp$9.eat = function(type) {
  if (this.type === type) {
    this.next();
    return true;
  } else {
    return false;
  }
};
pp$9.isContextual = function(name) {
  return this.type === types$1.name && this.value === name && !this.containsEsc;
};
pp$9.eatContextual = function(name) {
  if (!this.isContextual(name)) {
    return false;
  }
  this.next();
  return true;
};
pp$9.expectContextual = function(name) {
  if (!this.eatContextual(name)) {
    this.unexpected();
  }
};
pp$9.canInsertSemicolon = function() {
  return this.type === types$1.eof || this.type === types$1.braceR || lineBreak.test(this.input.slice(this.lastTokEnd, this.start));
};
pp$9.insertSemicolon = function() {
  if (this.canInsertSemicolon()) {
    if (this.options.onInsertedSemicolon) {
      this.options.onInsertedSemicolon(this.lastTokEnd, this.lastTokEndLoc);
    }
    return true;
  }
};
pp$9.semicolon = function() {
  if (!this.eat(types$1.semi) && !this.insertSemicolon()) {
    this.unexpected();
  }
};
pp$9.afterTrailingComma = function(tokType, notNext) {
  if (this.type === tokType) {
    if (this.options.onTrailingComma) {
      this.options.onTrailingComma(this.lastTokStart, this.lastTokStartLoc);
    }
    if (!notNext) {
      this.next();
    }
    return true;
  }
};
pp$9.expect = function(type) {
  this.eat(type) || this.unexpected();
};
pp$9.unexpected = function(pos) {
  this.raise(pos != null ? pos : this.start, "Unexpected token");
};
var DestructuringErrors = function DestructuringErrors2() {
  this.shorthandAssign = this.trailingComma = this.parenthesizedAssign = this.parenthesizedBind = this.doubleProto = -1;
};
pp$9.checkPatternErrors = function(refDestructuringErrors, isAssign) {
  if (!refDestructuringErrors) {
    return;
  }
  if (refDestructuringErrors.trailingComma > -1) {
    this.raiseRecoverable(refDestructuringErrors.trailingComma, "Comma is not permitted after the rest element");
  }
  var parens = isAssign ? refDestructuringErrors.parenthesizedAssign : refDestructuringErrors.parenthesizedBind;
  if (parens > -1) {
    this.raiseRecoverable(parens, isAssign ? "Assigning to rvalue" : "Parenthesized pattern");
  }
};
pp$9.checkExpressionErrors = function(refDestructuringErrors, andThrow) {
  if (!refDestructuringErrors) {
    return false;
  }
  var shorthandAssign = refDestructuringErrors.shorthandAssign;
  var doubleProto = refDestructuringErrors.doubleProto;
  if (!andThrow) {
    return shorthandAssign >= 0 || doubleProto >= 0;
  }
  if (shorthandAssign >= 0) {
    this.raise(shorthandAssign, "Shorthand property assignments are valid only in destructuring patterns");
  }
  if (doubleProto >= 0) {
    this.raiseRecoverable(doubleProto, "Redefinition of __proto__ property");
  }
};
pp$9.checkYieldAwaitInDefaultParams = function() {
  if (this.yieldPos && (!this.awaitPos || this.yieldPos < this.awaitPos)) {
    this.raise(this.yieldPos, "Yield expression cannot be a default value");
  }
  if (this.awaitPos) {
    this.raise(this.awaitPos, "Await expression cannot be a default value");
  }
};
pp$9.isSimpleAssignTarget = function(expr) {
  if (expr.type === "ParenthesizedExpression") {
    return this.isSimpleAssignTarget(expr.expression);
  }
  return expr.type === "Identifier" || expr.type === "MemberExpression";
};
var pp$8 = Parser.prototype;
pp$8.parseTopLevel = function(node) {
  var exports2 = /* @__PURE__ */ Object.create(null);
  if (!node.body) {
    node.body = [];
  }
  while (this.type !== types$1.eof) {
    var stmt = this.parseStatement(null, true, exports2);
    node.body.push(stmt);
  }
  if (this.inModule) {
    for (var i = 0, list2 = Object.keys(this.undefinedExports); i < list2.length; i += 1) {
      var name = list2[i];
      this.raiseRecoverable(this.undefinedExports[name].start, "Export '" + name + "' is not defined");
    }
  }
  this.adaptDirectivePrologue(node.body);
  this.next();
  node.sourceType = this.options.sourceType;
  return this.finishNode(node, "Program");
};
var loopLabel = { kind: "loop" }, switchLabel = { kind: "switch" };
pp$8.isLet = function(context) {
  if (this.options.ecmaVersion < 6 || !this.isContextual("let")) {
    return false;
  }
  skipWhiteSpace.lastIndex = this.pos;
  var skip = skipWhiteSpace.exec(this.input);
  var next = this.pos + skip[0].length, nextCh = this.input.charCodeAt(next);
  if (nextCh === 91 || nextCh === 92) {
    return true;
  }
  if (context) {
    return false;
  }
  if (nextCh === 123 || nextCh > 55295 && nextCh < 56320) {
    return true;
  }
  if (isIdentifierStart(nextCh, true)) {
    var pos = next + 1;
    while (isIdentifierChar(nextCh = this.input.charCodeAt(pos), true)) {
      ++pos;
    }
    if (nextCh === 92 || nextCh > 55295 && nextCh < 56320) {
      return true;
    }
    var ident = this.input.slice(next, pos);
    if (!keywordRelationalOperator.test(ident)) {
      return true;
    }
  }
  return false;
};
pp$8.isAsyncFunction = function() {
  if (this.options.ecmaVersion < 8 || !this.isContextual("async")) {
    return false;
  }
  skipWhiteSpace.lastIndex = this.pos;
  var skip = skipWhiteSpace.exec(this.input);
  var next = this.pos + skip[0].length, after;
  return !lineBreak.test(this.input.slice(this.pos, next)) && this.input.slice(next, next + 8) === "function" && (next + 8 === this.input.length || !(isIdentifierChar(after = this.input.charCodeAt(next + 8)) || after > 55295 && after < 56320));
};
pp$8.parseStatement = function(context, topLevel, exports2) {
  var starttype = this.type, node = this.startNode(), kind;
  if (this.isLet(context)) {
    starttype = types$1._var;
    kind = "let";
  }
  switch (starttype) {
    case types$1._break:
    case types$1._continue:
      return this.parseBreakContinueStatement(node, starttype.keyword);
    case types$1._debugger:
      return this.parseDebuggerStatement(node);
    case types$1._do:
      return this.parseDoStatement(node);
    case types$1._for:
      return this.parseForStatement(node);
    case types$1._function:
      if (context && (this.strict || context !== "if" && context !== "label") && this.options.ecmaVersion >= 6) {
        this.unexpected();
      }
      return this.parseFunctionStatement(node, false, !context);
    case types$1._class:
      if (context) {
        this.unexpected();
      }
      return this.parseClass(node, true);
    case types$1._if:
      return this.parseIfStatement(node);
    case types$1._return:
      return this.parseReturnStatement(node);
    case types$1._switch:
      return this.parseSwitchStatement(node);
    case types$1._throw:
      return this.parseThrowStatement(node);
    case types$1._try:
      return this.parseTryStatement(node);
    case types$1._const:
    case types$1._var:
      kind = kind || this.value;
      if (context && kind !== "var") {
        this.unexpected();
      }
      return this.parseVarStatement(node, kind);
    case types$1._while:
      return this.parseWhileStatement(node);
    case types$1._with:
      return this.parseWithStatement(node);
    case types$1.braceL:
      return this.parseBlock(true, node);
    case types$1.semi:
      return this.parseEmptyStatement(node);
    case types$1._export:
    case types$1._import:
      if (this.options.ecmaVersion > 10 && starttype === types$1._import) {
        skipWhiteSpace.lastIndex = this.pos;
        var skip = skipWhiteSpace.exec(this.input);
        var next = this.pos + skip[0].length, nextCh = this.input.charCodeAt(next);
        if (nextCh === 40 || nextCh === 46) {
          return this.parseExpressionStatement(node, this.parseExpression());
        }
      }
      if (!this.options.allowImportExportEverywhere) {
        if (!topLevel) {
          this.raise(this.start, "'import' and 'export' may only appear at the top level");
        }
        if (!this.inModule) {
          this.raise(this.start, "'import' and 'export' may appear only with 'sourceType: module'");
        }
      }
      return starttype === types$1._import ? this.parseImport(node) : this.parseExport(node, exports2);
    default:
      if (this.isAsyncFunction()) {
        if (context) {
          this.unexpected();
        }
        this.next();
        return this.parseFunctionStatement(node, true, !context);
      }
      var maybeName = this.value, expr = this.parseExpression();
      if (starttype === types$1.name && expr.type === "Identifier" && this.eat(types$1.colon)) {
        return this.parseLabeledStatement(node, maybeName, expr, context);
      } else {
        return this.parseExpressionStatement(node, expr);
      }
  }
};
pp$8.parseBreakContinueStatement = function(node, keyword) {
  var isBreak = keyword === "break";
  this.next();
  if (this.eat(types$1.semi) || this.insertSemicolon()) {
    node.label = null;
  } else if (this.type !== types$1.name) {
    this.unexpected();
  } else {
    node.label = this.parseIdent();
    this.semicolon();
  }
  var i = 0;
  for (; i < this.labels.length; ++i) {
    var lab = this.labels[i];
    if (node.label == null || lab.name === node.label.name) {
      if (lab.kind != null && (isBreak || lab.kind === "loop")) {
        break;
      }
      if (node.label && isBreak) {
        break;
      }
    }
  }
  if (i === this.labels.length) {
    this.raise(node.start, "Unsyntactic " + keyword);
  }
  return this.finishNode(node, isBreak ? "BreakStatement" : "ContinueStatement");
};
pp$8.parseDebuggerStatement = function(node) {
  this.next();
  this.semicolon();
  return this.finishNode(node, "DebuggerStatement");
};
pp$8.parseDoStatement = function(node) {
  this.next();
  this.labels.push(loopLabel);
  node.body = this.parseStatement("do");
  this.labels.pop();
  this.expect(types$1._while);
  node.test = this.parseParenExpression();
  if (this.options.ecmaVersion >= 6) {
    this.eat(types$1.semi);
  } else {
    this.semicolon();
  }
  return this.finishNode(node, "DoWhileStatement");
};
pp$8.parseForStatement = function(node) {
  this.next();
  var awaitAt = this.options.ecmaVersion >= 9 && this.canAwait && this.eatContextual("await") ? this.lastTokStart : -1;
  this.labels.push(loopLabel);
  this.enterScope(0);
  this.expect(types$1.parenL);
  if (this.type === types$1.semi) {
    if (awaitAt > -1) {
      this.unexpected(awaitAt);
    }
    return this.parseFor(node, null);
  }
  var isLet = this.isLet();
  if (this.type === types$1._var || this.type === types$1._const || isLet) {
    var init$1 = this.startNode(), kind = isLet ? "let" : this.value;
    this.next();
    this.parseVar(init$1, true, kind);
    this.finishNode(init$1, "VariableDeclaration");
    if ((this.type === types$1._in || this.options.ecmaVersion >= 6 && this.isContextual("of")) && init$1.declarations.length === 1) {
      if (this.options.ecmaVersion >= 9) {
        if (this.type === types$1._in) {
          if (awaitAt > -1) {
            this.unexpected(awaitAt);
          }
        } else {
          node.await = awaitAt > -1;
        }
      }
      return this.parseForIn(node, init$1);
    }
    if (awaitAt > -1) {
      this.unexpected(awaitAt);
    }
    return this.parseFor(node, init$1);
  }
  var startsWithLet = this.isContextual("let"), isForOf = false;
  var containsEsc = this.containsEsc;
  var refDestructuringErrors = new DestructuringErrors();
  var initPos = this.start;
  var init2 = awaitAt > -1 ? this.parseExprSubscripts(refDestructuringErrors, "await") : this.parseExpression(true, refDestructuringErrors);
  if (this.type === types$1._in || (isForOf = this.options.ecmaVersion >= 6 && this.isContextual("of"))) {
    if (awaitAt > -1) {
      if (this.type === types$1._in) {
        this.unexpected(awaitAt);
      }
      node.await = true;
    } else if (isForOf && this.options.ecmaVersion >= 8) {
      if (init2.start === initPos && !containsEsc && init2.type === "Identifier" && init2.name === "async") {
        this.unexpected();
      } else if (this.options.ecmaVersion >= 9) {
        node.await = false;
      }
    }
    if (startsWithLet && isForOf) {
      this.raise(init2.start, "The left-hand side of a for-of loop may not start with 'let'.");
    }
    this.toAssignable(init2, false, refDestructuringErrors);
    this.checkLValPattern(init2);
    return this.parseForIn(node, init2);
  } else {
    this.checkExpressionErrors(refDestructuringErrors, true);
  }
  if (awaitAt > -1) {
    this.unexpected(awaitAt);
  }
  return this.parseFor(node, init2);
};
pp$8.parseFunctionStatement = function(node, isAsync, declarationPosition) {
  this.next();
  return this.parseFunction(node, FUNC_STATEMENT | (declarationPosition ? 0 : FUNC_HANGING_STATEMENT), false, isAsync);
};
pp$8.parseIfStatement = function(node) {
  this.next();
  node.test = this.parseParenExpression();
  node.consequent = this.parseStatement("if");
  node.alternate = this.eat(types$1._else) ? this.parseStatement("if") : null;
  return this.finishNode(node, "IfStatement");
};
pp$8.parseReturnStatement = function(node) {
  if (!this.inFunction && !this.options.allowReturnOutsideFunction) {
    this.raise(this.start, "'return' outside of function");
  }
  this.next();
  if (this.eat(types$1.semi) || this.insertSemicolon()) {
    node.argument = null;
  } else {
    node.argument = this.parseExpression();
    this.semicolon();
  }
  return this.finishNode(node, "ReturnStatement");
};
pp$8.parseSwitchStatement = function(node) {
  this.next();
  node.discriminant = this.parseParenExpression();
  node.cases = [];
  this.expect(types$1.braceL);
  this.labels.push(switchLabel);
  this.enterScope(0);
  var cur;
  for (var sawDefault = false; this.type !== types$1.braceR; ) {
    if (this.type === types$1._case || this.type === types$1._default) {
      var isCase = this.type === types$1._case;
      if (cur) {
        this.finishNode(cur, "SwitchCase");
      }
      node.cases.push(cur = this.startNode());
      cur.consequent = [];
      this.next();
      if (isCase) {
        cur.test = this.parseExpression();
      } else {
        if (sawDefault) {
          this.raiseRecoverable(this.lastTokStart, "Multiple default clauses");
        }
        sawDefault = true;
        cur.test = null;
      }
      this.expect(types$1.colon);
    } else {
      if (!cur) {
        this.unexpected();
      }
      cur.consequent.push(this.parseStatement(null));
    }
  }
  this.exitScope();
  if (cur) {
    this.finishNode(cur, "SwitchCase");
  }
  this.next();
  this.labels.pop();
  return this.finishNode(node, "SwitchStatement");
};
pp$8.parseThrowStatement = function(node) {
  this.next();
  if (lineBreak.test(this.input.slice(this.lastTokEnd, this.start))) {
    this.raise(this.lastTokEnd, "Illegal newline after throw");
  }
  node.argument = this.parseExpression();
  this.semicolon();
  return this.finishNode(node, "ThrowStatement");
};
var empty$1 = [];
pp$8.parseCatchClauseParam = function() {
  var param = this.parseBindingAtom();
  var simple = param.type === "Identifier";
  this.enterScope(simple ? SCOPE_SIMPLE_CATCH : 0);
  this.checkLValPattern(param, simple ? BIND_SIMPLE_CATCH : BIND_LEXICAL);
  this.expect(types$1.parenR);
  return param;
};
pp$8.parseTryStatement = function(node) {
  this.next();
  node.block = this.parseBlock();
  node.handler = null;
  if (this.type === types$1._catch) {
    var clause = this.startNode();
    this.next();
    if (this.eat(types$1.parenL)) {
      clause.param = this.parseCatchClauseParam();
    } else {
      if (this.options.ecmaVersion < 10) {
        this.unexpected();
      }
      clause.param = null;
      this.enterScope(0);
    }
    clause.body = this.parseBlock(false);
    this.exitScope();
    node.handler = this.finishNode(clause, "CatchClause");
  }
  node.finalizer = this.eat(types$1._finally) ? this.parseBlock() : null;
  if (!node.handler && !node.finalizer) {
    this.raise(node.start, "Missing catch or finally clause");
  }
  return this.finishNode(node, "TryStatement");
};
pp$8.parseVarStatement = function(node, kind, allowMissingInitializer) {
  this.next();
  this.parseVar(node, false, kind, allowMissingInitializer);
  this.semicolon();
  return this.finishNode(node, "VariableDeclaration");
};
pp$8.parseWhileStatement = function(node) {
  this.next();
  node.test = this.parseParenExpression();
  this.labels.push(loopLabel);
  node.body = this.parseStatement("while");
  this.labels.pop();
  return this.finishNode(node, "WhileStatement");
};
pp$8.parseWithStatement = function(node) {
  if (this.strict) {
    this.raise(this.start, "'with' in strict mode");
  }
  this.next();
  node.object = this.parseParenExpression();
  node.body = this.parseStatement("with");
  return this.finishNode(node, "WithStatement");
};
pp$8.parseEmptyStatement = function(node) {
  this.next();
  return this.finishNode(node, "EmptyStatement");
};
pp$8.parseLabeledStatement = function(node, maybeName, expr, context) {
  for (var i$1 = 0, list2 = this.labels; i$1 < list2.length; i$1 += 1) {
    var label = list2[i$1];
    if (label.name === maybeName) {
      this.raise(expr.start, "Label '" + maybeName + "' is already declared");
    }
  }
  var kind = this.type.isLoop ? "loop" : this.type === types$1._switch ? "switch" : null;
  for (var i = this.labels.length - 1; i >= 0; i--) {
    var label$1 = this.labels[i];
    if (label$1.statementStart === node.start) {
      label$1.statementStart = this.start;
      label$1.kind = kind;
    } else {
      break;
    }
  }
  this.labels.push({ name: maybeName, kind, statementStart: this.start });
  node.body = this.parseStatement(context ? context.indexOf("label") === -1 ? context + "label" : context : "label");
  this.labels.pop();
  node.label = expr;
  return this.finishNode(node, "LabeledStatement");
};
pp$8.parseExpressionStatement = function(node, expr) {
  node.expression = expr;
  this.semicolon();
  return this.finishNode(node, "ExpressionStatement");
};
pp$8.parseBlock = function(createNewLexicalScope, node, exitStrict) {
  if (createNewLexicalScope === void 0) createNewLexicalScope = true;
  if (node === void 0) node = this.startNode();
  node.body = [];
  this.expect(types$1.braceL);
  if (createNewLexicalScope) {
    this.enterScope(0);
  }
  while (this.type !== types$1.braceR) {
    var stmt = this.parseStatement(null);
    node.body.push(stmt);
  }
  if (exitStrict) {
    this.strict = false;
  }
  this.next();
  if (createNewLexicalScope) {
    this.exitScope();
  }
  return this.finishNode(node, "BlockStatement");
};
pp$8.parseFor = function(node, init2) {
  node.init = init2;
  this.expect(types$1.semi);
  node.test = this.type === types$1.semi ? null : this.parseExpression();
  this.expect(types$1.semi);
  node.update = this.type === types$1.parenR ? null : this.parseExpression();
  this.expect(types$1.parenR);
  node.body = this.parseStatement("for");
  this.exitScope();
  this.labels.pop();
  return this.finishNode(node, "ForStatement");
};
pp$8.parseForIn = function(node, init2) {
  var isForIn = this.type === types$1._in;
  this.next();
  if (init2.type === "VariableDeclaration" && init2.declarations[0].init != null && (!isForIn || this.options.ecmaVersion < 8 || this.strict || init2.kind !== "var" || init2.declarations[0].id.type !== "Identifier")) {
    this.raise(
      init2.start,
      (isForIn ? "for-in" : "for-of") + " loop variable declaration may not have an initializer"
    );
  }
  node.left = init2;
  node.right = isForIn ? this.parseExpression() : this.parseMaybeAssign();
  this.expect(types$1.parenR);
  node.body = this.parseStatement("for");
  this.exitScope();
  this.labels.pop();
  return this.finishNode(node, isForIn ? "ForInStatement" : "ForOfStatement");
};
pp$8.parseVar = function(node, isFor, kind, allowMissingInitializer) {
  node.declarations = [];
  node.kind = kind;
  for (; ; ) {
    var decl = this.startNode();
    this.parseVarId(decl, kind);
    if (this.eat(types$1.eq)) {
      decl.init = this.parseMaybeAssign(isFor);
    } else if (!allowMissingInitializer && kind === "const" && !(this.type === types$1._in || this.options.ecmaVersion >= 6 && this.isContextual("of"))) {
      this.unexpected();
    } else if (!allowMissingInitializer && decl.id.type !== "Identifier" && !(isFor && (this.type === types$1._in || this.isContextual("of")))) {
      this.raise(this.lastTokEnd, "Complex binding patterns require an initialization value");
    } else {
      decl.init = null;
    }
    node.declarations.push(this.finishNode(decl, "VariableDeclarator"));
    if (!this.eat(types$1.comma)) {
      break;
    }
  }
  return node;
};
pp$8.parseVarId = function(decl, kind) {
  decl.id = this.parseBindingAtom();
  this.checkLValPattern(decl.id, kind === "var" ? BIND_VAR : BIND_LEXICAL, false);
};
var FUNC_STATEMENT = 1, FUNC_HANGING_STATEMENT = 2, FUNC_NULLABLE_ID = 4;
pp$8.parseFunction = function(node, statement, allowExpressionBody, isAsync, forInit) {
  this.initFunction(node);
  if (this.options.ecmaVersion >= 9 || this.options.ecmaVersion >= 6 && !isAsync) {
    if (this.type === types$1.star && statement & FUNC_HANGING_STATEMENT) {
      this.unexpected();
    }
    node.generator = this.eat(types$1.star);
  }
  if (this.options.ecmaVersion >= 8) {
    node.async = !!isAsync;
  }
  if (statement & FUNC_STATEMENT) {
    node.id = statement & FUNC_NULLABLE_ID && this.type !== types$1.name ? null : this.parseIdent();
    if (node.id && !(statement & FUNC_HANGING_STATEMENT)) {
      this.checkLValSimple(node.id, this.strict || node.generator || node.async ? this.treatFunctionsAsVar ? BIND_VAR : BIND_LEXICAL : BIND_FUNCTION);
    }
  }
  var oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;
  this.yieldPos = 0;
  this.awaitPos = 0;
  this.awaitIdentPos = 0;
  this.enterScope(functionFlags(node.async, node.generator));
  if (!(statement & FUNC_STATEMENT)) {
    node.id = this.type === types$1.name ? this.parseIdent() : null;
  }
  this.parseFunctionParams(node);
  this.parseFunctionBody(node, allowExpressionBody, false, forInit);
  this.yieldPos = oldYieldPos;
  this.awaitPos = oldAwaitPos;
  this.awaitIdentPos = oldAwaitIdentPos;
  return this.finishNode(node, statement & FUNC_STATEMENT ? "FunctionDeclaration" : "FunctionExpression");
};
pp$8.parseFunctionParams = function(node) {
  this.expect(types$1.parenL);
  node.params = this.parseBindingList(types$1.parenR, false, this.options.ecmaVersion >= 8);
  this.checkYieldAwaitInDefaultParams();
};
pp$8.parseClass = function(node, isStatement) {
  this.next();
  var oldStrict = this.strict;
  this.strict = true;
  this.parseClassId(node, isStatement);
  this.parseClassSuper(node);
  var privateNameMap = this.enterClassBody();
  var classBody = this.startNode();
  var hadConstructor = false;
  classBody.body = [];
  this.expect(types$1.braceL);
  while (this.type !== types$1.braceR) {
    var element2 = this.parseClassElement(node.superClass !== null);
    if (element2) {
      classBody.body.push(element2);
      if (element2.type === "MethodDefinition" && element2.kind === "constructor") {
        if (hadConstructor) {
          this.raiseRecoverable(element2.start, "Duplicate constructor in the same class");
        }
        hadConstructor = true;
      } else if (element2.key && element2.key.type === "PrivateIdentifier" && isPrivateNameConflicted(privateNameMap, element2)) {
        this.raiseRecoverable(element2.key.start, "Identifier '#" + element2.key.name + "' has already been declared");
      }
    }
  }
  this.strict = oldStrict;
  this.next();
  node.body = this.finishNode(classBody, "ClassBody");
  this.exitClassBody();
  return this.finishNode(node, isStatement ? "ClassDeclaration" : "ClassExpression");
};
pp$8.parseClassElement = function(constructorAllowsSuper) {
  if (this.eat(types$1.semi)) {
    return null;
  }
  var ecmaVersion = this.options.ecmaVersion;
  var node = this.startNode();
  var keyName = "";
  var isGenerator = false;
  var isAsync = false;
  var kind = "method";
  var isStatic = false;
  if (this.eatContextual("static")) {
    if (ecmaVersion >= 13 && this.eat(types$1.braceL)) {
      this.parseClassStaticBlock(node);
      return node;
    }
    if (this.isClassElementNameStart() || this.type === types$1.star) {
      isStatic = true;
    } else {
      keyName = "static";
    }
  }
  node.static = isStatic;
  if (!keyName && ecmaVersion >= 8 && this.eatContextual("async")) {
    if ((this.isClassElementNameStart() || this.type === types$1.star) && !this.canInsertSemicolon()) {
      isAsync = true;
    } else {
      keyName = "async";
    }
  }
  if (!keyName && (ecmaVersion >= 9 || !isAsync) && this.eat(types$1.star)) {
    isGenerator = true;
  }
  if (!keyName && !isAsync && !isGenerator) {
    var lastValue = this.value;
    if (this.eatContextual("get") || this.eatContextual("set")) {
      if (this.isClassElementNameStart()) {
        kind = lastValue;
      } else {
        keyName = lastValue;
      }
    }
  }
  if (keyName) {
    node.computed = false;
    node.key = this.startNodeAt(this.lastTokStart, this.lastTokStartLoc);
    node.key.name = keyName;
    this.finishNode(node.key, "Identifier");
  } else {
    this.parseClassElementName(node);
  }
  if (ecmaVersion < 13 || this.type === types$1.parenL || kind !== "method" || isGenerator || isAsync) {
    var isConstructor = !node.static && checkKeyName(node, "constructor");
    var allowsDirectSuper = isConstructor && constructorAllowsSuper;
    if (isConstructor && kind !== "method") {
      this.raise(node.key.start, "Constructor can't have get/set modifier");
    }
    node.kind = isConstructor ? "constructor" : kind;
    this.parseClassMethod(node, isGenerator, isAsync, allowsDirectSuper);
  } else {
    this.parseClassField(node);
  }
  return node;
};
pp$8.isClassElementNameStart = function() {
  return this.type === types$1.name || this.type === types$1.privateId || this.type === types$1.num || this.type === types$1.string || this.type === types$1.bracketL || this.type.keyword;
};
pp$8.parseClassElementName = function(element2) {
  if (this.type === types$1.privateId) {
    if (this.value === "constructor") {
      this.raise(this.start, "Classes can't have an element named '#constructor'");
    }
    element2.computed = false;
    element2.key = this.parsePrivateIdent();
  } else {
    this.parsePropertyName(element2);
  }
};
pp$8.parseClassMethod = function(method, isGenerator, isAsync, allowsDirectSuper) {
  var key = method.key;
  if (method.kind === "constructor") {
    if (isGenerator) {
      this.raise(key.start, "Constructor can't be a generator");
    }
    if (isAsync) {
      this.raise(key.start, "Constructor can't be an async method");
    }
  } else if (method.static && checkKeyName(method, "prototype")) {
    this.raise(key.start, "Classes may not have a static property named prototype");
  }
  var value = method.value = this.parseMethod(isGenerator, isAsync, allowsDirectSuper);
  if (method.kind === "get" && value.params.length !== 0) {
    this.raiseRecoverable(value.start, "getter should have no params");
  }
  if (method.kind === "set" && value.params.length !== 1) {
    this.raiseRecoverable(value.start, "setter should have exactly one param");
  }
  if (method.kind === "set" && value.params[0].type === "RestElement") {
    this.raiseRecoverable(value.params[0].start, "Setter cannot use rest params");
  }
  return this.finishNode(method, "MethodDefinition");
};
pp$8.parseClassField = function(field) {
  if (checkKeyName(field, "constructor")) {
    this.raise(field.key.start, "Classes can't have a field named 'constructor'");
  } else if (field.static && checkKeyName(field, "prototype")) {
    this.raise(field.key.start, "Classes can't have a static field named 'prototype'");
  }
  if (this.eat(types$1.eq)) {
    var scope = this.currentThisScope();
    var inClassFieldInit = scope.inClassFieldInit;
    scope.inClassFieldInit = true;
    field.value = this.parseMaybeAssign();
    scope.inClassFieldInit = inClassFieldInit;
  } else {
    field.value = null;
  }
  this.semicolon();
  return this.finishNode(field, "PropertyDefinition");
};
pp$8.parseClassStaticBlock = function(node) {
  node.body = [];
  var oldLabels = this.labels;
  this.labels = [];
  this.enterScope(SCOPE_CLASS_STATIC_BLOCK | SCOPE_SUPER);
  while (this.type !== types$1.braceR) {
    var stmt = this.parseStatement(null);
    node.body.push(stmt);
  }
  this.next();
  this.exitScope();
  this.labels = oldLabels;
  return this.finishNode(node, "StaticBlock");
};
pp$8.parseClassId = function(node, isStatement) {
  if (this.type === types$1.name) {
    node.id = this.parseIdent();
    if (isStatement) {
      this.checkLValSimple(node.id, BIND_LEXICAL, false);
    }
  } else {
    if (isStatement === true) {
      this.unexpected();
    }
    node.id = null;
  }
};
pp$8.parseClassSuper = function(node) {
  node.superClass = this.eat(types$1._extends) ? this.parseExprSubscripts(null, false) : null;
};
pp$8.enterClassBody = function() {
  var element2 = { declared: /* @__PURE__ */ Object.create(null), used: [] };
  this.privateNameStack.push(element2);
  return element2.declared;
};
pp$8.exitClassBody = function() {
  var ref2 = this.privateNameStack.pop();
  var declared = ref2.declared;
  var used = ref2.used;
  if (!this.options.checkPrivateFields) {
    return;
  }
  var len = this.privateNameStack.length;
  var parent = len === 0 ? null : this.privateNameStack[len - 1];
  for (var i = 0; i < used.length; ++i) {
    var id = used[i];
    if (!hasOwn(declared, id.name)) {
      if (parent) {
        parent.used.push(id);
      } else {
        this.raiseRecoverable(id.start, "Private field '#" + id.name + "' must be declared in an enclosing class");
      }
    }
  }
};
function isPrivateNameConflicted(privateNameMap, element2) {
  var name = element2.key.name;
  var curr = privateNameMap[name];
  var next = "true";
  if (element2.type === "MethodDefinition" && (element2.kind === "get" || element2.kind === "set")) {
    next = (element2.static ? "s" : "i") + element2.kind;
  }
  if (curr === "iget" && next === "iset" || curr === "iset" && next === "iget" || curr === "sget" && next === "sset" || curr === "sset" && next === "sget") {
    privateNameMap[name] = "true";
    return false;
  } else if (!curr) {
    privateNameMap[name] = next;
    return false;
  } else {
    return true;
  }
}
function checkKeyName(node, name) {
  var computed = node.computed;
  var key = node.key;
  return !computed && (key.type === "Identifier" && key.name === name || key.type === "Literal" && key.value === name);
}
pp$8.parseExportAllDeclaration = function(node, exports2) {
  if (this.options.ecmaVersion >= 11) {
    if (this.eatContextual("as")) {
      node.exported = this.parseModuleExportName();
      this.checkExport(exports2, node.exported, this.lastTokStart);
    } else {
      node.exported = null;
    }
  }
  this.expectContextual("from");
  if (this.type !== types$1.string) {
    this.unexpected();
  }
  node.source = this.parseExprAtom();
  this.semicolon();
  return this.finishNode(node, "ExportAllDeclaration");
};
pp$8.parseExport = function(node, exports2) {
  this.next();
  if (this.eat(types$1.star)) {
    return this.parseExportAllDeclaration(node, exports2);
  }
  if (this.eat(types$1._default)) {
    this.checkExport(exports2, "default", this.lastTokStart);
    node.declaration = this.parseExportDefaultDeclaration();
    return this.finishNode(node, "ExportDefaultDeclaration");
  }
  if (this.shouldParseExportStatement()) {
    node.declaration = this.parseExportDeclaration(node);
    if (node.declaration.type === "VariableDeclaration") {
      this.checkVariableExport(exports2, node.declaration.declarations);
    } else {
      this.checkExport(exports2, node.declaration.id, node.declaration.id.start);
    }
    node.specifiers = [];
    node.source = null;
  } else {
    node.declaration = null;
    node.specifiers = this.parseExportSpecifiers(exports2);
    if (this.eatContextual("from")) {
      if (this.type !== types$1.string) {
        this.unexpected();
      }
      node.source = this.parseExprAtom();
    } else {
      for (var i = 0, list2 = node.specifiers; i < list2.length; i += 1) {
        var spec = list2[i];
        this.checkUnreserved(spec.local);
        this.checkLocalExport(spec.local);
        if (spec.local.type === "Literal") {
          this.raise(spec.local.start, "A string literal cannot be used as an exported binding without `from`.");
        }
      }
      node.source = null;
    }
    this.semicolon();
  }
  return this.finishNode(node, "ExportNamedDeclaration");
};
pp$8.parseExportDeclaration = function(node) {
  return this.parseStatement(null);
};
pp$8.parseExportDefaultDeclaration = function() {
  var isAsync;
  if (this.type === types$1._function || (isAsync = this.isAsyncFunction())) {
    var fNode = this.startNode();
    this.next();
    if (isAsync) {
      this.next();
    }
    return this.parseFunction(fNode, FUNC_STATEMENT | FUNC_NULLABLE_ID, false, isAsync);
  } else if (this.type === types$1._class) {
    var cNode = this.startNode();
    return this.parseClass(cNode, "nullableID");
  } else {
    var declaration = this.parseMaybeAssign();
    this.semicolon();
    return declaration;
  }
};
pp$8.checkExport = function(exports2, name, pos) {
  if (!exports2) {
    return;
  }
  if (typeof name !== "string") {
    name = name.type === "Identifier" ? name.name : name.value;
  }
  if (hasOwn(exports2, name)) {
    this.raiseRecoverable(pos, "Duplicate export '" + name + "'");
  }
  exports2[name] = true;
};
pp$8.checkPatternExport = function(exports2, pat) {
  var type = pat.type;
  if (type === "Identifier") {
    this.checkExport(exports2, pat, pat.start);
  } else if (type === "ObjectPattern") {
    for (var i = 0, list2 = pat.properties; i < list2.length; i += 1) {
      var prop2 = list2[i];
      this.checkPatternExport(exports2, prop2);
    }
  } else if (type === "ArrayPattern") {
    for (var i$1 = 0, list$1 = pat.elements; i$1 < list$1.length; i$1 += 1) {
      var elt = list$1[i$1];
      if (elt) {
        this.checkPatternExport(exports2, elt);
      }
    }
  } else if (type === "Property") {
    this.checkPatternExport(exports2, pat.value);
  } else if (type === "AssignmentPattern") {
    this.checkPatternExport(exports2, pat.left);
  } else if (type === "RestElement") {
    this.checkPatternExport(exports2, pat.argument);
  }
};
pp$8.checkVariableExport = function(exports2, decls) {
  if (!exports2) {
    return;
  }
  for (var i = 0, list2 = decls; i < list2.length; i += 1) {
    var decl = list2[i];
    this.checkPatternExport(exports2, decl.id);
  }
};
pp$8.shouldParseExportStatement = function() {
  return this.type.keyword === "var" || this.type.keyword === "const" || this.type.keyword === "class" || this.type.keyword === "function" || this.isLet() || this.isAsyncFunction();
};
pp$8.parseExportSpecifier = function(exports2) {
  var node = this.startNode();
  node.local = this.parseModuleExportName();
  node.exported = this.eatContextual("as") ? this.parseModuleExportName() : node.local;
  this.checkExport(
    exports2,
    node.exported,
    node.exported.start
  );
  return this.finishNode(node, "ExportSpecifier");
};
pp$8.parseExportSpecifiers = function(exports2) {
  var nodes = [], first = true;
  this.expect(types$1.braceL);
  while (!this.eat(types$1.braceR)) {
    if (!first) {
      this.expect(types$1.comma);
      if (this.afterTrailingComma(types$1.braceR)) {
        break;
      }
    } else {
      first = false;
    }
    nodes.push(this.parseExportSpecifier(exports2));
  }
  return nodes;
};
pp$8.parseImport = function(node) {
  this.next();
  if (this.type === types$1.string) {
    node.specifiers = empty$1;
    node.source = this.parseExprAtom();
  } else {
    node.specifiers = this.parseImportSpecifiers();
    this.expectContextual("from");
    node.source = this.type === types$1.string ? this.parseExprAtom() : this.unexpected();
  }
  this.semicolon();
  return this.finishNode(node, "ImportDeclaration");
};
pp$8.parseImportSpecifier = function() {
  var node = this.startNode();
  node.imported = this.parseModuleExportName();
  if (this.eatContextual("as")) {
    node.local = this.parseIdent();
  } else {
    this.checkUnreserved(node.imported);
    node.local = node.imported;
  }
  this.checkLValSimple(node.local, BIND_LEXICAL);
  return this.finishNode(node, "ImportSpecifier");
};
pp$8.parseImportDefaultSpecifier = function() {
  var node = this.startNode();
  node.local = this.parseIdent();
  this.checkLValSimple(node.local, BIND_LEXICAL);
  return this.finishNode(node, "ImportDefaultSpecifier");
};
pp$8.parseImportNamespaceSpecifier = function() {
  var node = this.startNode();
  this.next();
  this.expectContextual("as");
  node.local = this.parseIdent();
  this.checkLValSimple(node.local, BIND_LEXICAL);
  return this.finishNode(node, "ImportNamespaceSpecifier");
};
pp$8.parseImportSpecifiers = function() {
  var nodes = [], first = true;
  if (this.type === types$1.name) {
    nodes.push(this.parseImportDefaultSpecifier());
    if (!this.eat(types$1.comma)) {
      return nodes;
    }
  }
  if (this.type === types$1.star) {
    nodes.push(this.parseImportNamespaceSpecifier());
    return nodes;
  }
  this.expect(types$1.braceL);
  while (!this.eat(types$1.braceR)) {
    if (!first) {
      this.expect(types$1.comma);
      if (this.afterTrailingComma(types$1.braceR)) {
        break;
      }
    } else {
      first = false;
    }
    nodes.push(this.parseImportSpecifier());
  }
  return nodes;
};
pp$8.parseModuleExportName = function() {
  if (this.options.ecmaVersion >= 13 && this.type === types$1.string) {
    var stringLiteral = this.parseLiteral(this.value);
    if (loneSurrogate.test(stringLiteral.value)) {
      this.raise(stringLiteral.start, "An export name cannot include a lone surrogate.");
    }
    return stringLiteral;
  }
  return this.parseIdent(true);
};
pp$8.adaptDirectivePrologue = function(statements) {
  for (var i = 0; i < statements.length && this.isDirectiveCandidate(statements[i]); ++i) {
    statements[i].directive = statements[i].expression.raw.slice(1, -1);
  }
};
pp$8.isDirectiveCandidate = function(statement) {
  return this.options.ecmaVersion >= 5 && statement.type === "ExpressionStatement" && statement.expression.type === "Literal" && typeof statement.expression.value === "string" && // Reject parenthesized strings.
  (this.input[statement.start] === '"' || this.input[statement.start] === "'");
};
var pp$7 = Parser.prototype;
pp$7.toAssignable = function(node, isBinding, refDestructuringErrors) {
  if (this.options.ecmaVersion >= 6 && node) {
    switch (node.type) {
      case "Identifier":
        if (this.inAsync && node.name === "await") {
          this.raise(node.start, "Cannot use 'await' as identifier inside an async function");
        }
        break;
      case "ObjectPattern":
      case "ArrayPattern":
      case "AssignmentPattern":
      case "RestElement":
        break;
      case "ObjectExpression":
        node.type = "ObjectPattern";
        if (refDestructuringErrors) {
          this.checkPatternErrors(refDestructuringErrors, true);
        }
        for (var i = 0, list2 = node.properties; i < list2.length; i += 1) {
          var prop2 = list2[i];
          this.toAssignable(prop2, isBinding);
          if (prop2.type === "RestElement" && (prop2.argument.type === "ArrayPattern" || prop2.argument.type === "ObjectPattern")) {
            this.raise(prop2.argument.start, "Unexpected token");
          }
        }
        break;
      case "Property":
        if (node.kind !== "init") {
          this.raise(node.key.start, "Object pattern can't contain getter or setter");
        }
        this.toAssignable(node.value, isBinding);
        break;
      case "ArrayExpression":
        node.type = "ArrayPattern";
        if (refDestructuringErrors) {
          this.checkPatternErrors(refDestructuringErrors, true);
        }
        this.toAssignableList(node.elements, isBinding);
        break;
      case "SpreadElement":
        node.type = "RestElement";
        this.toAssignable(node.argument, isBinding);
        if (node.argument.type === "AssignmentPattern") {
          this.raise(node.argument.start, "Rest elements cannot have a default value");
        }
        break;
      case "AssignmentExpression":
        if (node.operator !== "=") {
          this.raise(node.left.end, "Only '=' operator can be used for specifying default value.");
        }
        node.type = "AssignmentPattern";
        delete node.operator;
        this.toAssignable(node.left, isBinding);
        break;
      case "ParenthesizedExpression":
        this.toAssignable(node.expression, isBinding, refDestructuringErrors);
        break;
      case "ChainExpression":
        this.raiseRecoverable(node.start, "Optional chaining cannot appear in left-hand side");
        break;
      case "MemberExpression":
        if (!isBinding) {
          break;
        }
      default:
        this.raise(node.start, "Assigning to rvalue");
    }
  } else if (refDestructuringErrors) {
    this.checkPatternErrors(refDestructuringErrors, true);
  }
  return node;
};
pp$7.toAssignableList = function(exprList, isBinding) {
  var end = exprList.length;
  for (var i = 0; i < end; i++) {
    var elt = exprList[i];
    if (elt) {
      this.toAssignable(elt, isBinding);
    }
  }
  if (end) {
    var last = exprList[end - 1];
    if (this.options.ecmaVersion === 6 && isBinding && last && last.type === "RestElement" && last.argument.type !== "Identifier") {
      this.unexpected(last.argument.start);
    }
  }
  return exprList;
};
pp$7.parseSpread = function(refDestructuringErrors) {
  var node = this.startNode();
  this.next();
  node.argument = this.parseMaybeAssign(false, refDestructuringErrors);
  return this.finishNode(node, "SpreadElement");
};
pp$7.parseRestBinding = function() {
  var node = this.startNode();
  this.next();
  if (this.options.ecmaVersion === 6 && this.type !== types$1.name) {
    this.unexpected();
  }
  node.argument = this.parseBindingAtom();
  return this.finishNode(node, "RestElement");
};
pp$7.parseBindingAtom = function() {
  if (this.options.ecmaVersion >= 6) {
    switch (this.type) {
      case types$1.bracketL:
        var node = this.startNode();
        this.next();
        node.elements = this.parseBindingList(types$1.bracketR, true, true);
        return this.finishNode(node, "ArrayPattern");
      case types$1.braceL:
        return this.parseObj(true);
    }
  }
  return this.parseIdent();
};
pp$7.parseBindingList = function(close, allowEmpty, allowTrailingComma, allowModifiers) {
  var elts = [], first = true;
  while (!this.eat(close)) {
    if (first) {
      first = false;
    } else {
      this.expect(types$1.comma);
    }
    if (allowEmpty && this.type === types$1.comma) {
      elts.push(null);
    } else if (allowTrailingComma && this.afterTrailingComma(close)) {
      break;
    } else if (this.type === types$1.ellipsis) {
      var rest = this.parseRestBinding();
      this.parseBindingListItem(rest);
      elts.push(rest);
      if (this.type === types$1.comma) {
        this.raiseRecoverable(this.start, "Comma is not permitted after the rest element");
      }
      this.expect(close);
      break;
    } else {
      elts.push(this.parseAssignableListItem(allowModifiers));
    }
  }
  return elts;
};
pp$7.parseAssignableListItem = function(allowModifiers) {
  var elem = this.parseMaybeDefault(this.start, this.startLoc);
  this.parseBindingListItem(elem);
  return elem;
};
pp$7.parseBindingListItem = function(param) {
  return param;
};
pp$7.parseMaybeDefault = function(startPos, startLoc, left) {
  left = left || this.parseBindingAtom();
  if (this.options.ecmaVersion < 6 || !this.eat(types$1.eq)) {
    return left;
  }
  var node = this.startNodeAt(startPos, startLoc);
  node.left = left;
  node.right = this.parseMaybeAssign();
  return this.finishNode(node, "AssignmentPattern");
};
pp$7.checkLValSimple = function(expr, bindingType, checkClashes) {
  if (bindingType === void 0) bindingType = BIND_NONE;
  var isBind = bindingType !== BIND_NONE;
  switch (expr.type) {
    case "Identifier":
      if (this.strict && this.reservedWordsStrictBind.test(expr.name)) {
        this.raiseRecoverable(expr.start, (isBind ? "Binding " : "Assigning to ") + expr.name + " in strict mode");
      }
      if (isBind) {
        if (bindingType === BIND_LEXICAL && expr.name === "let") {
          this.raiseRecoverable(expr.start, "let is disallowed as a lexically bound name");
        }
        if (checkClashes) {
          if (hasOwn(checkClashes, expr.name)) {
            this.raiseRecoverable(expr.start, "Argument name clash");
          }
          checkClashes[expr.name] = true;
        }
        if (bindingType !== BIND_OUTSIDE) {
          this.declareName(expr.name, bindingType, expr.start);
        }
      }
      break;
    case "ChainExpression":
      this.raiseRecoverable(expr.start, "Optional chaining cannot appear in left-hand side");
      break;
    case "MemberExpression":
      if (isBind) {
        this.raiseRecoverable(expr.start, "Binding member expression");
      }
      break;
    case "ParenthesizedExpression":
      if (isBind) {
        this.raiseRecoverable(expr.start, "Binding parenthesized expression");
      }
      return this.checkLValSimple(expr.expression, bindingType, checkClashes);
    default:
      this.raise(expr.start, (isBind ? "Binding" : "Assigning to") + " rvalue");
  }
};
pp$7.checkLValPattern = function(expr, bindingType, checkClashes) {
  if (bindingType === void 0) bindingType = BIND_NONE;
  switch (expr.type) {
    case "ObjectPattern":
      for (var i = 0, list2 = expr.properties; i < list2.length; i += 1) {
        var prop2 = list2[i];
        this.checkLValInnerPattern(prop2, bindingType, checkClashes);
      }
      break;
    case "ArrayPattern":
      for (var i$1 = 0, list$1 = expr.elements; i$1 < list$1.length; i$1 += 1) {
        var elem = list$1[i$1];
        if (elem) {
          this.checkLValInnerPattern(elem, bindingType, checkClashes);
        }
      }
      break;
    default:
      this.checkLValSimple(expr, bindingType, checkClashes);
  }
};
pp$7.checkLValInnerPattern = function(expr, bindingType, checkClashes) {
  if (bindingType === void 0) bindingType = BIND_NONE;
  switch (expr.type) {
    case "Property":
      this.checkLValInnerPattern(expr.value, bindingType, checkClashes);
      break;
    case "AssignmentPattern":
      this.checkLValPattern(expr.left, bindingType, checkClashes);
      break;
    case "RestElement":
      this.checkLValPattern(expr.argument, bindingType, checkClashes);
      break;
    default:
      this.checkLValPattern(expr, bindingType, checkClashes);
  }
};
var TokContext = function TokContext2(token, isExpr, preserveSpace, override, generator) {
  this.token = token;
  this.isExpr = !!isExpr;
  this.preserveSpace = !!preserveSpace;
  this.override = override;
  this.generator = !!generator;
};
var types = {
  b_stat: new TokContext("{", false),
  b_expr: new TokContext("{", true),
  b_tmpl: new TokContext("${", false),
  p_stat: new TokContext("(", false),
  p_expr: new TokContext("(", true),
  q_tmpl: new TokContext("`", true, true, function(p2) {
    return p2.tryReadTemplateToken();
  }),
  f_stat: new TokContext("function", false),
  f_expr: new TokContext("function", true),
  f_expr_gen: new TokContext("function", true, false, null, true),
  f_gen: new TokContext("function", false, false, null, true)
};
var pp$6 = Parser.prototype;
pp$6.initialContext = function() {
  return [types.b_stat];
};
pp$6.curContext = function() {
  return this.context[this.context.length - 1];
};
pp$6.braceIsBlock = function(prevType) {
  var parent = this.curContext();
  if (parent === types.f_expr || parent === types.f_stat) {
    return true;
  }
  if (prevType === types$1.colon && (parent === types.b_stat || parent === types.b_expr)) {
    return !parent.isExpr;
  }
  if (prevType === types$1._return || prevType === types$1.name && this.exprAllowed) {
    return lineBreak.test(this.input.slice(this.lastTokEnd, this.start));
  }
  if (prevType === types$1._else || prevType === types$1.semi || prevType === types$1.eof || prevType === types$1.parenR || prevType === types$1.arrow) {
    return true;
  }
  if (prevType === types$1.braceL) {
    return parent === types.b_stat;
  }
  if (prevType === types$1._var || prevType === types$1._const || prevType === types$1.name) {
    return false;
  }
  return !this.exprAllowed;
};
pp$6.inGeneratorContext = function() {
  for (var i = this.context.length - 1; i >= 1; i--) {
    var context = this.context[i];
    if (context.token === "function") {
      return context.generator;
    }
  }
  return false;
};
pp$6.updateContext = function(prevType) {
  var update2, type = this.type;
  if (type.keyword && prevType === types$1.dot) {
    this.exprAllowed = false;
  } else if (update2 = type.updateContext) {
    update2.call(this, prevType);
  } else {
    this.exprAllowed = type.beforeExpr;
  }
};
pp$6.overrideContext = function(tokenCtx) {
  if (this.curContext() !== tokenCtx) {
    this.context[this.context.length - 1] = tokenCtx;
  }
};
types$1.parenR.updateContext = types$1.braceR.updateContext = function() {
  if (this.context.length === 1) {
    this.exprAllowed = true;
    return;
  }
  var out = this.context.pop();
  if (out === types.b_stat && this.curContext().token === "function") {
    out = this.context.pop();
  }
  this.exprAllowed = !out.isExpr;
};
types$1.braceL.updateContext = function(prevType) {
  this.context.push(this.braceIsBlock(prevType) ? types.b_stat : types.b_expr);
  this.exprAllowed = true;
};
types$1.dollarBraceL.updateContext = function() {
  this.context.push(types.b_tmpl);
  this.exprAllowed = true;
};
types$1.parenL.updateContext = function(prevType) {
  var statementParens = prevType === types$1._if || prevType === types$1._for || prevType === types$1._with || prevType === types$1._while;
  this.context.push(statementParens ? types.p_stat : types.p_expr);
  this.exprAllowed = true;
};
types$1.incDec.updateContext = function() {
};
types$1._function.updateContext = types$1._class.updateContext = function(prevType) {
  if (prevType.beforeExpr && prevType !== types$1._else && !(prevType === types$1.semi && this.curContext() !== types.p_stat) && !(prevType === types$1._return && lineBreak.test(this.input.slice(this.lastTokEnd, this.start))) && !((prevType === types$1.colon || prevType === types$1.braceL) && this.curContext() === types.b_stat)) {
    this.context.push(types.f_expr);
  } else {
    this.context.push(types.f_stat);
  }
  this.exprAllowed = false;
};
types$1.colon.updateContext = function() {
  if (this.curContext().token === "function") {
    this.context.pop();
  }
  this.exprAllowed = true;
};
types$1.backQuote.updateContext = function() {
  if (this.curContext() === types.q_tmpl) {
    this.context.pop();
  } else {
    this.context.push(types.q_tmpl);
  }
  this.exprAllowed = false;
};
types$1.star.updateContext = function(prevType) {
  if (prevType === types$1._function) {
    var index2 = this.context.length - 1;
    if (this.context[index2] === types.f_expr) {
      this.context[index2] = types.f_expr_gen;
    } else {
      this.context[index2] = types.f_gen;
    }
  }
  this.exprAllowed = true;
};
types$1.name.updateContext = function(prevType) {
  var allowed = false;
  if (this.options.ecmaVersion >= 6 && prevType !== types$1.dot) {
    if (this.value === "of" && !this.exprAllowed || this.value === "yield" && this.inGeneratorContext()) {
      allowed = true;
    }
  }
  this.exprAllowed = allowed;
};
var pp$5 = Parser.prototype;
pp$5.checkPropClash = function(prop2, propHash, refDestructuringErrors) {
  if (this.options.ecmaVersion >= 9 && prop2.type === "SpreadElement") {
    return;
  }
  if (this.options.ecmaVersion >= 6 && (prop2.computed || prop2.method || prop2.shorthand)) {
    return;
  }
  var key = prop2.key;
  var name;
  switch (key.type) {
    case "Identifier":
      name = key.name;
      break;
    case "Literal":
      name = String(key.value);
      break;
    default:
      return;
  }
  var kind = prop2.kind;
  if (this.options.ecmaVersion >= 6) {
    if (name === "__proto__" && kind === "init") {
      if (propHash.proto) {
        if (refDestructuringErrors) {
          if (refDestructuringErrors.doubleProto < 0) {
            refDestructuringErrors.doubleProto = key.start;
          }
        } else {
          this.raiseRecoverable(key.start, "Redefinition of __proto__ property");
        }
      }
      propHash.proto = true;
    }
    return;
  }
  name = "$" + name;
  var other = propHash[name];
  if (other) {
    var redefinition;
    if (kind === "init") {
      redefinition = this.strict && other.init || other.get || other.set;
    } else {
      redefinition = other.init || other[kind];
    }
    if (redefinition) {
      this.raiseRecoverable(key.start, "Redefinition of property");
    }
  } else {
    other = propHash[name] = {
      init: false,
      get: false,
      set: false
    };
  }
  other[kind] = true;
};
pp$5.parseExpression = function(forInit, refDestructuringErrors) {
  var startPos = this.start, startLoc = this.startLoc;
  var expr = this.parseMaybeAssign(forInit, refDestructuringErrors);
  if (this.type === types$1.comma) {
    var node = this.startNodeAt(startPos, startLoc);
    node.expressions = [expr];
    while (this.eat(types$1.comma)) {
      node.expressions.push(this.parseMaybeAssign(forInit, refDestructuringErrors));
    }
    return this.finishNode(node, "SequenceExpression");
  }
  return expr;
};
pp$5.parseMaybeAssign = function(forInit, refDestructuringErrors, afterLeftParse) {
  if (this.isContextual("yield")) {
    if (this.inGenerator) {
      return this.parseYield(forInit);
    } else {
      this.exprAllowed = false;
    }
  }
  var ownDestructuringErrors = false, oldParenAssign = -1, oldTrailingComma = -1, oldDoubleProto = -1;
  if (refDestructuringErrors) {
    oldParenAssign = refDestructuringErrors.parenthesizedAssign;
    oldTrailingComma = refDestructuringErrors.trailingComma;
    oldDoubleProto = refDestructuringErrors.doubleProto;
    refDestructuringErrors.parenthesizedAssign = refDestructuringErrors.trailingComma = -1;
  } else {
    refDestructuringErrors = new DestructuringErrors();
    ownDestructuringErrors = true;
  }
  var startPos = this.start, startLoc = this.startLoc;
  if (this.type === types$1.parenL || this.type === types$1.name) {
    this.potentialArrowAt = this.start;
    this.potentialArrowInForAwait = forInit === "await";
  }
  var left = this.parseMaybeConditional(forInit, refDestructuringErrors);
  if (afterLeftParse) {
    left = afterLeftParse.call(this, left, startPos, startLoc);
  }
  if (this.type.isAssign) {
    var node = this.startNodeAt(startPos, startLoc);
    node.operator = this.value;
    if (this.type === types$1.eq) {
      left = this.toAssignable(left, false, refDestructuringErrors);
    }
    if (!ownDestructuringErrors) {
      refDestructuringErrors.parenthesizedAssign = refDestructuringErrors.trailingComma = refDestructuringErrors.doubleProto = -1;
    }
    if (refDestructuringErrors.shorthandAssign >= left.start) {
      refDestructuringErrors.shorthandAssign = -1;
    }
    if (this.type === types$1.eq) {
      this.checkLValPattern(left);
    } else {
      this.checkLValSimple(left);
    }
    node.left = left;
    this.next();
    node.right = this.parseMaybeAssign(forInit);
    if (oldDoubleProto > -1) {
      refDestructuringErrors.doubleProto = oldDoubleProto;
    }
    return this.finishNode(node, "AssignmentExpression");
  } else {
    if (ownDestructuringErrors) {
      this.checkExpressionErrors(refDestructuringErrors, true);
    }
  }
  if (oldParenAssign > -1) {
    refDestructuringErrors.parenthesizedAssign = oldParenAssign;
  }
  if (oldTrailingComma > -1) {
    refDestructuringErrors.trailingComma = oldTrailingComma;
  }
  return left;
};
pp$5.parseMaybeConditional = function(forInit, refDestructuringErrors) {
  var startPos = this.start, startLoc = this.startLoc;
  var expr = this.parseExprOps(forInit, refDestructuringErrors);
  if (this.checkExpressionErrors(refDestructuringErrors)) {
    return expr;
  }
  if (this.eat(types$1.question)) {
    var node = this.startNodeAt(startPos, startLoc);
    node.test = expr;
    node.consequent = this.parseMaybeAssign();
    this.expect(types$1.colon);
    node.alternate = this.parseMaybeAssign(forInit);
    return this.finishNode(node, "ConditionalExpression");
  }
  return expr;
};
pp$5.parseExprOps = function(forInit, refDestructuringErrors) {
  var startPos = this.start, startLoc = this.startLoc;
  var expr = this.parseMaybeUnary(refDestructuringErrors, false, false, forInit);
  if (this.checkExpressionErrors(refDestructuringErrors)) {
    return expr;
  }
  return expr.start === startPos && expr.type === "ArrowFunctionExpression" ? expr : this.parseExprOp(expr, startPos, startLoc, -1, forInit);
};
pp$5.parseExprOp = function(left, leftStartPos, leftStartLoc, minPrec, forInit) {
  var prec = this.type.binop;
  if (prec != null && (!forInit || this.type !== types$1._in)) {
    if (prec > minPrec) {
      var logical = this.type === types$1.logicalOR || this.type === types$1.logicalAND;
      var coalesce = this.type === types$1.coalesce;
      if (coalesce) {
        prec = types$1.logicalAND.binop;
      }
      var op = this.value;
      this.next();
      var startPos = this.start, startLoc = this.startLoc;
      var right = this.parseExprOp(this.parseMaybeUnary(null, false, false, forInit), startPos, startLoc, prec, forInit);
      var node = this.buildBinary(leftStartPos, leftStartLoc, left, right, op, logical || coalesce);
      if (logical && this.type === types$1.coalesce || coalesce && (this.type === types$1.logicalOR || this.type === types$1.logicalAND)) {
        this.raiseRecoverable(this.start, "Logical expressions and coalesce expressions cannot be mixed. Wrap either by parentheses");
      }
      return this.parseExprOp(node, leftStartPos, leftStartLoc, minPrec, forInit);
    }
  }
  return left;
};
pp$5.buildBinary = function(startPos, startLoc, left, right, op, logical) {
  if (right.type === "PrivateIdentifier") {
    this.raise(right.start, "Private identifier can only be left side of binary expression");
  }
  var node = this.startNodeAt(startPos, startLoc);
  node.left = left;
  node.operator = op;
  node.right = right;
  return this.finishNode(node, logical ? "LogicalExpression" : "BinaryExpression");
};
pp$5.parseMaybeUnary = function(refDestructuringErrors, sawUnary, incDec, forInit) {
  var startPos = this.start, startLoc = this.startLoc, expr;
  if (this.isContextual("await") && this.canAwait) {
    expr = this.parseAwait(forInit);
    sawUnary = true;
  } else if (this.type.prefix) {
    var node = this.startNode(), update2 = this.type === types$1.incDec;
    node.operator = this.value;
    node.prefix = true;
    this.next();
    node.argument = this.parseMaybeUnary(null, true, update2, forInit);
    this.checkExpressionErrors(refDestructuringErrors, true);
    if (update2) {
      this.checkLValSimple(node.argument);
    } else if (this.strict && node.operator === "delete" && isLocalVariableAccess(node.argument)) {
      this.raiseRecoverable(node.start, "Deleting local variable in strict mode");
    } else if (node.operator === "delete" && isPrivateFieldAccess(node.argument)) {
      this.raiseRecoverable(node.start, "Private fields can not be deleted");
    } else {
      sawUnary = true;
    }
    expr = this.finishNode(node, update2 ? "UpdateExpression" : "UnaryExpression");
  } else if (!sawUnary && this.type === types$1.privateId) {
    if ((forInit || this.privateNameStack.length === 0) && this.options.checkPrivateFields) {
      this.unexpected();
    }
    expr = this.parsePrivateIdent();
    if (this.type !== types$1._in) {
      this.unexpected();
    }
  } else {
    expr = this.parseExprSubscripts(refDestructuringErrors, forInit);
    if (this.checkExpressionErrors(refDestructuringErrors)) {
      return expr;
    }
    while (this.type.postfix && !this.canInsertSemicolon()) {
      var node$1 = this.startNodeAt(startPos, startLoc);
      node$1.operator = this.value;
      node$1.prefix = false;
      node$1.argument = expr;
      this.checkLValSimple(expr);
      this.next();
      expr = this.finishNode(node$1, "UpdateExpression");
    }
  }
  if (!incDec && this.eat(types$1.starstar)) {
    if (sawUnary) {
      this.unexpected(this.lastTokStart);
    } else {
      return this.buildBinary(startPos, startLoc, expr, this.parseMaybeUnary(null, false, false, forInit), "**", false);
    }
  } else {
    return expr;
  }
};
function isLocalVariableAccess(node) {
  return node.type === "Identifier" || node.type === "ParenthesizedExpression" && isLocalVariableAccess(node.expression);
}
function isPrivateFieldAccess(node) {
  return node.type === "MemberExpression" && node.property.type === "PrivateIdentifier" || node.type === "ChainExpression" && isPrivateFieldAccess(node.expression) || node.type === "ParenthesizedExpression" && isPrivateFieldAccess(node.expression);
}
pp$5.parseExprSubscripts = function(refDestructuringErrors, forInit) {
  var startPos = this.start, startLoc = this.startLoc;
  var expr = this.parseExprAtom(refDestructuringErrors, forInit);
  if (expr.type === "ArrowFunctionExpression" && this.input.slice(this.lastTokStart, this.lastTokEnd) !== ")") {
    return expr;
  }
  var result = this.parseSubscripts(expr, startPos, startLoc, false, forInit);
  if (refDestructuringErrors && result.type === "MemberExpression") {
    if (refDestructuringErrors.parenthesizedAssign >= result.start) {
      refDestructuringErrors.parenthesizedAssign = -1;
    }
    if (refDestructuringErrors.parenthesizedBind >= result.start) {
      refDestructuringErrors.parenthesizedBind = -1;
    }
    if (refDestructuringErrors.trailingComma >= result.start) {
      refDestructuringErrors.trailingComma = -1;
    }
  }
  return result;
};
pp$5.parseSubscripts = function(base, startPos, startLoc, noCalls, forInit) {
  var maybeAsyncArrow = this.options.ecmaVersion >= 8 && base.type === "Identifier" && base.name === "async" && this.lastTokEnd === base.end && !this.canInsertSemicolon() && base.end - base.start === 5 && this.potentialArrowAt === base.start;
  var optionalChained = false;
  while (true) {
    var element2 = this.parseSubscript(base, startPos, startLoc, noCalls, maybeAsyncArrow, optionalChained, forInit);
    if (element2.optional) {
      optionalChained = true;
    }
    if (element2 === base || element2.type === "ArrowFunctionExpression") {
      if (optionalChained) {
        var chainNode = this.startNodeAt(startPos, startLoc);
        chainNode.expression = element2;
        element2 = this.finishNode(chainNode, "ChainExpression");
      }
      return element2;
    }
    base = element2;
  }
};
pp$5.shouldParseAsyncArrow = function() {
  return !this.canInsertSemicolon() && this.eat(types$1.arrow);
};
pp$5.parseSubscriptAsyncArrow = function(startPos, startLoc, exprList, forInit) {
  return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), exprList, true, forInit);
};
pp$5.parseSubscript = function(base, startPos, startLoc, noCalls, maybeAsyncArrow, optionalChained, forInit) {
  var optionalSupported = this.options.ecmaVersion >= 11;
  var optional = optionalSupported && this.eat(types$1.questionDot);
  if (noCalls && optional) {
    this.raise(this.lastTokStart, "Optional chaining cannot appear in the callee of new expressions");
  }
  var computed = this.eat(types$1.bracketL);
  if (computed || optional && this.type !== types$1.parenL && this.type !== types$1.backQuote || this.eat(types$1.dot)) {
    var node = this.startNodeAt(startPos, startLoc);
    node.object = base;
    if (computed) {
      node.property = this.parseExpression();
      this.expect(types$1.bracketR);
    } else if (this.type === types$1.privateId && base.type !== "Super") {
      node.property = this.parsePrivateIdent();
    } else {
      node.property = this.parseIdent(this.options.allowReserved !== "never");
    }
    node.computed = !!computed;
    if (optionalSupported) {
      node.optional = optional;
    }
    base = this.finishNode(node, "MemberExpression");
  } else if (!noCalls && this.eat(types$1.parenL)) {
    var refDestructuringErrors = new DestructuringErrors(), oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;
    this.yieldPos = 0;
    this.awaitPos = 0;
    this.awaitIdentPos = 0;
    var exprList = this.parseExprList(types$1.parenR, this.options.ecmaVersion >= 8, false, refDestructuringErrors);
    if (maybeAsyncArrow && !optional && this.shouldParseAsyncArrow()) {
      this.checkPatternErrors(refDestructuringErrors, false);
      this.checkYieldAwaitInDefaultParams();
      if (this.awaitIdentPos > 0) {
        this.raise(this.awaitIdentPos, "Cannot use 'await' as identifier inside an async function");
      }
      this.yieldPos = oldYieldPos;
      this.awaitPos = oldAwaitPos;
      this.awaitIdentPos = oldAwaitIdentPos;
      return this.parseSubscriptAsyncArrow(startPos, startLoc, exprList, forInit);
    }
    this.checkExpressionErrors(refDestructuringErrors, true);
    this.yieldPos = oldYieldPos || this.yieldPos;
    this.awaitPos = oldAwaitPos || this.awaitPos;
    this.awaitIdentPos = oldAwaitIdentPos || this.awaitIdentPos;
    var node$1 = this.startNodeAt(startPos, startLoc);
    node$1.callee = base;
    node$1.arguments = exprList;
    if (optionalSupported) {
      node$1.optional = optional;
    }
    base = this.finishNode(node$1, "CallExpression");
  } else if (this.type === types$1.backQuote) {
    if (optional || optionalChained) {
      this.raise(this.start, "Optional chaining cannot appear in the tag of tagged template expressions");
    }
    var node$2 = this.startNodeAt(startPos, startLoc);
    node$2.tag = base;
    node$2.quasi = this.parseTemplate({ isTagged: true });
    base = this.finishNode(node$2, "TaggedTemplateExpression");
  }
  return base;
};
pp$5.parseExprAtom = function(refDestructuringErrors, forInit, forNew) {
  if (this.type === types$1.slash) {
    this.readRegexp();
  }
  var node, canBeArrow = this.potentialArrowAt === this.start;
  switch (this.type) {
    case types$1._super:
      if (!this.allowSuper) {
        this.raise(this.start, "'super' keyword outside a method");
      }
      node = this.startNode();
      this.next();
      if (this.type === types$1.parenL && !this.allowDirectSuper) {
        this.raise(node.start, "super() call outside constructor of a subclass");
      }
      if (this.type !== types$1.dot && this.type !== types$1.bracketL && this.type !== types$1.parenL) {
        this.unexpected();
      }
      return this.finishNode(node, "Super");
    case types$1._this:
      node = this.startNode();
      this.next();
      return this.finishNode(node, "ThisExpression");
    case types$1.name:
      var startPos = this.start, startLoc = this.startLoc, containsEsc = this.containsEsc;
      var id = this.parseIdent(false);
      if (this.options.ecmaVersion >= 8 && !containsEsc && id.name === "async" && !this.canInsertSemicolon() && this.eat(types$1._function)) {
        this.overrideContext(types.f_expr);
        return this.parseFunction(this.startNodeAt(startPos, startLoc), 0, false, true, forInit);
      }
      if (canBeArrow && !this.canInsertSemicolon()) {
        if (this.eat(types$1.arrow)) {
          return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id], false, forInit);
        }
        if (this.options.ecmaVersion >= 8 && id.name === "async" && this.type === types$1.name && !containsEsc && (!this.potentialArrowInForAwait || this.value !== "of" || this.containsEsc)) {
          id = this.parseIdent(false);
          if (this.canInsertSemicolon() || !this.eat(types$1.arrow)) {
            this.unexpected();
          }
          return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id], true, forInit);
        }
      }
      return id;
    case types$1.regexp:
      var value = this.value;
      node = this.parseLiteral(value.value);
      node.regex = { pattern: value.pattern, flags: value.flags };
      return node;
    case types$1.num:
    case types$1.string:
      return this.parseLiteral(this.value);
    case types$1._null:
    case types$1._true:
    case types$1._false:
      node = this.startNode();
      node.value = this.type === types$1._null ? null : this.type === types$1._true;
      node.raw = this.type.keyword;
      this.next();
      return this.finishNode(node, "Literal");
    case types$1.parenL:
      var start = this.start, expr = this.parseParenAndDistinguishExpression(canBeArrow, forInit);
      if (refDestructuringErrors) {
        if (refDestructuringErrors.parenthesizedAssign < 0 && !this.isSimpleAssignTarget(expr)) {
          refDestructuringErrors.parenthesizedAssign = start;
        }
        if (refDestructuringErrors.parenthesizedBind < 0) {
          refDestructuringErrors.parenthesizedBind = start;
        }
      }
      return expr;
    case types$1.bracketL:
      node = this.startNode();
      this.next();
      node.elements = this.parseExprList(types$1.bracketR, true, true, refDestructuringErrors);
      return this.finishNode(node, "ArrayExpression");
    case types$1.braceL:
      this.overrideContext(types.b_expr);
      return this.parseObj(false, refDestructuringErrors);
    case types$1._function:
      node = this.startNode();
      this.next();
      return this.parseFunction(node, 0);
    case types$1._class:
      return this.parseClass(this.startNode(), false);
    case types$1._new:
      return this.parseNew();
    case types$1.backQuote:
      return this.parseTemplate();
    case types$1._import:
      if (this.options.ecmaVersion >= 11) {
        return this.parseExprImport(forNew);
      } else {
        return this.unexpected();
      }
    default:
      return this.parseExprAtomDefault();
  }
};
pp$5.parseExprAtomDefault = function() {
  this.unexpected();
};
pp$5.parseExprImport = function(forNew) {
  var node = this.startNode();
  if (this.containsEsc) {
    this.raiseRecoverable(this.start, "Escape sequence in keyword import");
  }
  this.next();
  if (this.type === types$1.parenL && !forNew) {
    return this.parseDynamicImport(node);
  } else if (this.type === types$1.dot) {
    var meta = this.startNodeAt(node.start, node.loc && node.loc.start);
    meta.name = "import";
    node.meta = this.finishNode(meta, "Identifier");
    return this.parseImportMeta(node);
  } else {
    this.unexpected();
  }
};
pp$5.parseDynamicImport = function(node) {
  this.next();
  node.source = this.parseMaybeAssign();
  if (!this.eat(types$1.parenR)) {
    var errorPos = this.start;
    if (this.eat(types$1.comma) && this.eat(types$1.parenR)) {
      this.raiseRecoverable(errorPos, "Trailing comma is not allowed in import()");
    } else {
      this.unexpected(errorPos);
    }
  }
  return this.finishNode(node, "ImportExpression");
};
pp$5.parseImportMeta = function(node) {
  this.next();
  var containsEsc = this.containsEsc;
  node.property = this.parseIdent(true);
  if (node.property.name !== "meta") {
    this.raiseRecoverable(node.property.start, "The only valid meta property for import is 'import.meta'");
  }
  if (containsEsc) {
    this.raiseRecoverable(node.start, "'import.meta' must not contain escaped characters");
  }
  if (this.options.sourceType !== "module" && !this.options.allowImportExportEverywhere) {
    this.raiseRecoverable(node.start, "Cannot use 'import.meta' outside a module");
  }
  return this.finishNode(node, "MetaProperty");
};
pp$5.parseLiteral = function(value) {
  var node = this.startNode();
  node.value = value;
  node.raw = this.input.slice(this.start, this.end);
  if (node.raw.charCodeAt(node.raw.length - 1) === 110) {
    node.bigint = node.raw.slice(0, -1).replace(/_/g, "");
  }
  this.next();
  return this.finishNode(node, "Literal");
};
pp$5.parseParenExpression = function() {
  this.expect(types$1.parenL);
  var val = this.parseExpression();
  this.expect(types$1.parenR);
  return val;
};
pp$5.shouldParseArrow = function(exprList) {
  return !this.canInsertSemicolon();
};
pp$5.parseParenAndDistinguishExpression = function(canBeArrow, forInit) {
  var startPos = this.start, startLoc = this.startLoc, val, allowTrailingComma = this.options.ecmaVersion >= 8;
  if (this.options.ecmaVersion >= 6) {
    this.next();
    var innerStartPos = this.start, innerStartLoc = this.startLoc;
    var exprList = [], first = true, lastIsComma = false;
    var refDestructuringErrors = new DestructuringErrors(), oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, spreadStart;
    this.yieldPos = 0;
    this.awaitPos = 0;
    while (this.type !== types$1.parenR) {
      first ? first = false : this.expect(types$1.comma);
      if (allowTrailingComma && this.afterTrailingComma(types$1.parenR, true)) {
        lastIsComma = true;
        break;
      } else if (this.type === types$1.ellipsis) {
        spreadStart = this.start;
        exprList.push(this.parseParenItem(this.parseRestBinding()));
        if (this.type === types$1.comma) {
          this.raiseRecoverable(
            this.start,
            "Comma is not permitted after the rest element"
          );
        }
        break;
      } else {
        exprList.push(this.parseMaybeAssign(false, refDestructuringErrors, this.parseParenItem));
      }
    }
    var innerEndPos = this.lastTokEnd, innerEndLoc = this.lastTokEndLoc;
    this.expect(types$1.parenR);
    if (canBeArrow && this.shouldParseArrow(exprList) && this.eat(types$1.arrow)) {
      this.checkPatternErrors(refDestructuringErrors, false);
      this.checkYieldAwaitInDefaultParams();
      this.yieldPos = oldYieldPos;
      this.awaitPos = oldAwaitPos;
      return this.parseParenArrowList(startPos, startLoc, exprList, forInit);
    }
    if (!exprList.length || lastIsComma) {
      this.unexpected(this.lastTokStart);
    }
    if (spreadStart) {
      this.unexpected(spreadStart);
    }
    this.checkExpressionErrors(refDestructuringErrors, true);
    this.yieldPos = oldYieldPos || this.yieldPos;
    this.awaitPos = oldAwaitPos || this.awaitPos;
    if (exprList.length > 1) {
      val = this.startNodeAt(innerStartPos, innerStartLoc);
      val.expressions = exprList;
      this.finishNodeAt(val, "SequenceExpression", innerEndPos, innerEndLoc);
    } else {
      val = exprList[0];
    }
  } else {
    val = this.parseParenExpression();
  }
  if (this.options.preserveParens) {
    var par = this.startNodeAt(startPos, startLoc);
    par.expression = val;
    return this.finishNode(par, "ParenthesizedExpression");
  } else {
    return val;
  }
};
pp$5.parseParenItem = function(item) {
  return item;
};
pp$5.parseParenArrowList = function(startPos, startLoc, exprList, forInit) {
  return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), exprList, false, forInit);
};
var empty = [];
pp$5.parseNew = function() {
  if (this.containsEsc) {
    this.raiseRecoverable(this.start, "Escape sequence in keyword new");
  }
  var node = this.startNode();
  this.next();
  if (this.options.ecmaVersion >= 6 && this.type === types$1.dot) {
    var meta = this.startNodeAt(node.start, node.loc && node.loc.start);
    meta.name = "new";
    node.meta = this.finishNode(meta, "Identifier");
    this.next();
    var containsEsc = this.containsEsc;
    node.property = this.parseIdent(true);
    if (node.property.name !== "target") {
      this.raiseRecoverable(node.property.start, "The only valid meta property for new is 'new.target'");
    }
    if (containsEsc) {
      this.raiseRecoverable(node.start, "'new.target' must not contain escaped characters");
    }
    if (!this.allowNewDotTarget) {
      this.raiseRecoverable(node.start, "'new.target' can only be used in functions and class static block");
    }
    return this.finishNode(node, "MetaProperty");
  }
  var startPos = this.start, startLoc = this.startLoc;
  node.callee = this.parseSubscripts(this.parseExprAtom(null, false, true), startPos, startLoc, true, false);
  if (this.eat(types$1.parenL)) {
    node.arguments = this.parseExprList(types$1.parenR, this.options.ecmaVersion >= 8, false);
  } else {
    node.arguments = empty;
  }
  return this.finishNode(node, "NewExpression");
};
pp$5.parseTemplateElement = function(ref2) {
  var isTagged = ref2.isTagged;
  var elem = this.startNode();
  if (this.type === types$1.invalidTemplate) {
    if (!isTagged) {
      this.raiseRecoverable(this.start, "Bad escape sequence in untagged template literal");
    }
    elem.value = {
      raw: this.value.replace(/\r\n?/g, "\n"),
      cooked: null
    };
  } else {
    elem.value = {
      raw: this.input.slice(this.start, this.end).replace(/\r\n?/g, "\n"),
      cooked: this.value
    };
  }
  this.next();
  elem.tail = this.type === types$1.backQuote;
  return this.finishNode(elem, "TemplateElement");
};
pp$5.parseTemplate = function(ref2) {
  if (ref2 === void 0) ref2 = {};
  var isTagged = ref2.isTagged;
  if (isTagged === void 0) isTagged = false;
  var node = this.startNode();
  this.next();
  node.expressions = [];
  var curElt = this.parseTemplateElement({ isTagged });
  node.quasis = [curElt];
  while (!curElt.tail) {
    if (this.type === types$1.eof) {
      this.raise(this.pos, "Unterminated template literal");
    }
    this.expect(types$1.dollarBraceL);
    node.expressions.push(this.parseExpression());
    this.expect(types$1.braceR);
    node.quasis.push(curElt = this.parseTemplateElement({ isTagged }));
  }
  this.next();
  return this.finishNode(node, "TemplateLiteral");
};
pp$5.isAsyncProp = function(prop2) {
  return !prop2.computed && prop2.key.type === "Identifier" && prop2.key.name === "async" && (this.type === types$1.name || this.type === types$1.num || this.type === types$1.string || this.type === types$1.bracketL || this.type.keyword || this.options.ecmaVersion >= 9 && this.type === types$1.star) && !lineBreak.test(this.input.slice(this.lastTokEnd, this.start));
};
pp$5.parseObj = function(isPattern, refDestructuringErrors) {
  var node = this.startNode(), first = true, propHash = {};
  node.properties = [];
  this.next();
  while (!this.eat(types$1.braceR)) {
    if (!first) {
      this.expect(types$1.comma);
      if (this.options.ecmaVersion >= 5 && this.afterTrailingComma(types$1.braceR)) {
        break;
      }
    } else {
      first = false;
    }
    var prop2 = this.parseProperty(isPattern, refDestructuringErrors);
    if (!isPattern) {
      this.checkPropClash(prop2, propHash, refDestructuringErrors);
    }
    node.properties.push(prop2);
  }
  return this.finishNode(node, isPattern ? "ObjectPattern" : "ObjectExpression");
};
pp$5.parseProperty = function(isPattern, refDestructuringErrors) {
  var prop2 = this.startNode(), isGenerator, isAsync, startPos, startLoc;
  if (this.options.ecmaVersion >= 9 && this.eat(types$1.ellipsis)) {
    if (isPattern) {
      prop2.argument = this.parseIdent(false);
      if (this.type === types$1.comma) {
        this.raiseRecoverable(this.start, "Comma is not permitted after the rest element");
      }
      return this.finishNode(prop2, "RestElement");
    }
    prop2.argument = this.parseMaybeAssign(false, refDestructuringErrors);
    if (this.type === types$1.comma && refDestructuringErrors && refDestructuringErrors.trailingComma < 0) {
      refDestructuringErrors.trailingComma = this.start;
    }
    return this.finishNode(prop2, "SpreadElement");
  }
  if (this.options.ecmaVersion >= 6) {
    prop2.method = false;
    prop2.shorthand = false;
    if (isPattern || refDestructuringErrors) {
      startPos = this.start;
      startLoc = this.startLoc;
    }
    if (!isPattern) {
      isGenerator = this.eat(types$1.star);
    }
  }
  var containsEsc = this.containsEsc;
  this.parsePropertyName(prop2);
  if (!isPattern && !containsEsc && this.options.ecmaVersion >= 8 && !isGenerator && this.isAsyncProp(prop2)) {
    isAsync = true;
    isGenerator = this.options.ecmaVersion >= 9 && this.eat(types$1.star);
    this.parsePropertyName(prop2);
  } else {
    isAsync = false;
  }
  this.parsePropertyValue(prop2, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors, containsEsc);
  return this.finishNode(prop2, "Property");
};
pp$5.parseGetterSetter = function(prop2) {
  prop2.kind = prop2.key.name;
  this.parsePropertyName(prop2);
  prop2.value = this.parseMethod(false);
  var paramCount = prop2.kind === "get" ? 0 : 1;
  if (prop2.value.params.length !== paramCount) {
    var start = prop2.value.start;
    if (prop2.kind === "get") {
      this.raiseRecoverable(start, "getter should have no params");
    } else {
      this.raiseRecoverable(start, "setter should have exactly one param");
    }
  } else {
    if (prop2.kind === "set" && prop2.value.params[0].type === "RestElement") {
      this.raiseRecoverable(prop2.value.params[0].start, "Setter cannot use rest params");
    }
  }
};
pp$5.parsePropertyValue = function(prop2, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors, containsEsc) {
  if ((isGenerator || isAsync) && this.type === types$1.colon) {
    this.unexpected();
  }
  if (this.eat(types$1.colon)) {
    prop2.value = isPattern ? this.parseMaybeDefault(this.start, this.startLoc) : this.parseMaybeAssign(false, refDestructuringErrors);
    prop2.kind = "init";
  } else if (this.options.ecmaVersion >= 6 && this.type === types$1.parenL) {
    if (isPattern) {
      this.unexpected();
    }
    prop2.kind = "init";
    prop2.method = true;
    prop2.value = this.parseMethod(isGenerator, isAsync);
  } else if (!isPattern && !containsEsc && this.options.ecmaVersion >= 5 && !prop2.computed && prop2.key.type === "Identifier" && (prop2.key.name === "get" || prop2.key.name === "set") && (this.type !== types$1.comma && this.type !== types$1.braceR && this.type !== types$1.eq)) {
    if (isGenerator || isAsync) {
      this.unexpected();
    }
    this.parseGetterSetter(prop2);
  } else if (this.options.ecmaVersion >= 6 && !prop2.computed && prop2.key.type === "Identifier") {
    if (isGenerator || isAsync) {
      this.unexpected();
    }
    this.checkUnreserved(prop2.key);
    if (prop2.key.name === "await" && !this.awaitIdentPos) {
      this.awaitIdentPos = startPos;
    }
    prop2.kind = "init";
    if (isPattern) {
      prop2.value = this.parseMaybeDefault(startPos, startLoc, this.copyNode(prop2.key));
    } else if (this.type === types$1.eq && refDestructuringErrors) {
      if (refDestructuringErrors.shorthandAssign < 0) {
        refDestructuringErrors.shorthandAssign = this.start;
      }
      prop2.value = this.parseMaybeDefault(startPos, startLoc, this.copyNode(prop2.key));
    } else {
      prop2.value = this.copyNode(prop2.key);
    }
    prop2.shorthand = true;
  } else {
    this.unexpected();
  }
};
pp$5.parsePropertyName = function(prop2) {
  if (this.options.ecmaVersion >= 6) {
    if (this.eat(types$1.bracketL)) {
      prop2.computed = true;
      prop2.key = this.parseMaybeAssign();
      this.expect(types$1.bracketR);
      return prop2.key;
    } else {
      prop2.computed = false;
    }
  }
  return prop2.key = this.type === types$1.num || this.type === types$1.string ? this.parseExprAtom() : this.parseIdent(this.options.allowReserved !== "never");
};
pp$5.initFunction = function(node) {
  node.id = null;
  if (this.options.ecmaVersion >= 6) {
    node.generator = node.expression = false;
  }
  if (this.options.ecmaVersion >= 8) {
    node.async = false;
  }
};
pp$5.parseMethod = function(isGenerator, isAsync, allowDirectSuper) {
  var node = this.startNode(), oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;
  this.initFunction(node);
  if (this.options.ecmaVersion >= 6) {
    node.generator = isGenerator;
  }
  if (this.options.ecmaVersion >= 8) {
    node.async = !!isAsync;
  }
  this.yieldPos = 0;
  this.awaitPos = 0;
  this.awaitIdentPos = 0;
  this.enterScope(functionFlags(isAsync, node.generator) | SCOPE_SUPER | (allowDirectSuper ? SCOPE_DIRECT_SUPER : 0));
  this.expect(types$1.parenL);
  node.params = this.parseBindingList(types$1.parenR, false, this.options.ecmaVersion >= 8);
  this.checkYieldAwaitInDefaultParams();
  this.parseFunctionBody(node, false, true, false);
  this.yieldPos = oldYieldPos;
  this.awaitPos = oldAwaitPos;
  this.awaitIdentPos = oldAwaitIdentPos;
  return this.finishNode(node, "FunctionExpression");
};
pp$5.parseArrowExpression = function(node, params, isAsync, forInit) {
  var oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;
  this.enterScope(functionFlags(isAsync, false) | SCOPE_ARROW);
  this.initFunction(node);
  if (this.options.ecmaVersion >= 8) {
    node.async = !!isAsync;
  }
  this.yieldPos = 0;
  this.awaitPos = 0;
  this.awaitIdentPos = 0;
  node.params = this.toAssignableList(params, true);
  this.parseFunctionBody(node, true, false, forInit);
  this.yieldPos = oldYieldPos;
  this.awaitPos = oldAwaitPos;
  this.awaitIdentPos = oldAwaitIdentPos;
  return this.finishNode(node, "ArrowFunctionExpression");
};
pp$5.parseFunctionBody = function(node, isArrowFunction, isMethod, forInit) {
  var isExpression = isArrowFunction && this.type !== types$1.braceL;
  var oldStrict = this.strict, useStrict = false;
  if (isExpression) {
    node.body = this.parseMaybeAssign(forInit);
    node.expression = true;
    this.checkParams(node, false);
  } else {
    var nonSimple = this.options.ecmaVersion >= 7 && !this.isSimpleParamList(node.params);
    if (!oldStrict || nonSimple) {
      useStrict = this.strictDirective(this.end);
      if (useStrict && nonSimple) {
        this.raiseRecoverable(node.start, "Illegal 'use strict' directive in function with non-simple parameter list");
      }
    }
    var oldLabels = this.labels;
    this.labels = [];
    if (useStrict) {
      this.strict = true;
    }
    this.checkParams(node, !oldStrict && !useStrict && !isArrowFunction && !isMethod && this.isSimpleParamList(node.params));
    if (this.strict && node.id) {
      this.checkLValSimple(node.id, BIND_OUTSIDE);
    }
    node.body = this.parseBlock(false, void 0, useStrict && !oldStrict);
    node.expression = false;
    this.adaptDirectivePrologue(node.body.body);
    this.labels = oldLabels;
  }
  this.exitScope();
};
pp$5.isSimpleParamList = function(params) {
  for (var i = 0, list2 = params; i < list2.length; i += 1) {
    var param = list2[i];
    if (param.type !== "Identifier") {
      return false;
    }
  }
  return true;
};
pp$5.checkParams = function(node, allowDuplicates) {
  var nameHash = /* @__PURE__ */ Object.create(null);
  for (var i = 0, list2 = node.params; i < list2.length; i += 1) {
    var param = list2[i];
    this.checkLValInnerPattern(param, BIND_VAR, allowDuplicates ? null : nameHash);
  }
};
pp$5.parseExprList = function(close, allowTrailingComma, allowEmpty, refDestructuringErrors) {
  var elts = [], first = true;
  while (!this.eat(close)) {
    if (!first) {
      this.expect(types$1.comma);
      if (allowTrailingComma && this.afterTrailingComma(close)) {
        break;
      }
    } else {
      first = false;
    }
    var elt = void 0;
    if (allowEmpty && this.type === types$1.comma) {
      elt = null;
    } else if (this.type === types$1.ellipsis) {
      elt = this.parseSpread(refDestructuringErrors);
      if (refDestructuringErrors && this.type === types$1.comma && refDestructuringErrors.trailingComma < 0) {
        refDestructuringErrors.trailingComma = this.start;
      }
    } else {
      elt = this.parseMaybeAssign(false, refDestructuringErrors);
    }
    elts.push(elt);
  }
  return elts;
};
pp$5.checkUnreserved = function(ref2) {
  var start = ref2.start;
  var end = ref2.end;
  var name = ref2.name;
  if (this.inGenerator && name === "yield") {
    this.raiseRecoverable(start, "Cannot use 'yield' as identifier inside a generator");
  }
  if (this.inAsync && name === "await") {
    this.raiseRecoverable(start, "Cannot use 'await' as identifier inside an async function");
  }
  if (this.currentThisScope().inClassFieldInit && name === "arguments") {
    this.raiseRecoverable(start, "Cannot use 'arguments' in class field initializer");
  }
  if (this.inClassStaticBlock && (name === "arguments" || name === "await")) {
    this.raise(start, "Cannot use " + name + " in class static initialization block");
  }
  if (this.keywords.test(name)) {
    this.raise(start, "Unexpected keyword '" + name + "'");
  }
  if (this.options.ecmaVersion < 6 && this.input.slice(start, end).indexOf("\\") !== -1) {
    return;
  }
  var re = this.strict ? this.reservedWordsStrict : this.reservedWords;
  if (re.test(name)) {
    if (!this.inAsync && name === "await") {
      this.raiseRecoverable(start, "Cannot use keyword 'await' outside an async function");
    }
    this.raiseRecoverable(start, "The keyword '" + name + "' is reserved");
  }
};
pp$5.parseIdent = function(liberal) {
  var node = this.parseIdentNode();
  this.next(!!liberal);
  this.finishNode(node, "Identifier");
  if (!liberal) {
    this.checkUnreserved(node);
    if (node.name === "await" && !this.awaitIdentPos) {
      this.awaitIdentPos = node.start;
    }
  }
  return node;
};
pp$5.parseIdentNode = function() {
  var node = this.startNode();
  if (this.type === types$1.name) {
    node.name = this.value;
  } else if (this.type.keyword) {
    node.name = this.type.keyword;
    if ((node.name === "class" || node.name === "function") && (this.lastTokEnd !== this.lastTokStart + 1 || this.input.charCodeAt(this.lastTokStart) !== 46)) {
      this.context.pop();
    }
    this.type = types$1.name;
  } else {
    this.unexpected();
  }
  return node;
};
pp$5.parsePrivateIdent = function() {
  var node = this.startNode();
  if (this.type === types$1.privateId) {
    node.name = this.value;
  } else {
    this.unexpected();
  }
  this.next();
  this.finishNode(node, "PrivateIdentifier");
  if (this.options.checkPrivateFields) {
    if (this.privateNameStack.length === 0) {
      this.raise(node.start, "Private field '#" + node.name + "' must be declared in an enclosing class");
    } else {
      this.privateNameStack[this.privateNameStack.length - 1].used.push(node);
    }
  }
  return node;
};
pp$5.parseYield = function(forInit) {
  if (!this.yieldPos) {
    this.yieldPos = this.start;
  }
  var node = this.startNode();
  this.next();
  if (this.type === types$1.semi || this.canInsertSemicolon() || this.type !== types$1.star && !this.type.startsExpr) {
    node.delegate = false;
    node.argument = null;
  } else {
    node.delegate = this.eat(types$1.star);
    node.argument = this.parseMaybeAssign(forInit);
  }
  return this.finishNode(node, "YieldExpression");
};
pp$5.parseAwait = function(forInit) {
  if (!this.awaitPos) {
    this.awaitPos = this.start;
  }
  var node = this.startNode();
  this.next();
  node.argument = this.parseMaybeUnary(null, true, false, forInit);
  return this.finishNode(node, "AwaitExpression");
};
var pp$4 = Parser.prototype;
pp$4.raise = function(pos, message) {
  var loc = getLineInfo(this.input, pos);
  message += " (" + loc.line + ":" + loc.column + ")";
  var err = new SyntaxError(message);
  err.pos = pos;
  err.loc = loc;
  err.raisedAt = this.pos;
  throw err;
};
pp$4.raiseRecoverable = pp$4.raise;
pp$4.curPosition = function() {
  if (this.options.locations) {
    return new Position(this.curLine, this.pos - this.lineStart);
  }
};
var pp$3 = Parser.prototype;
var Scope = function Scope2(flags) {
  this.flags = flags;
  this.var = [];
  this.lexical = [];
  this.functions = [];
  this.inClassFieldInit = false;
};
pp$3.enterScope = function(flags) {
  this.scopeStack.push(new Scope(flags));
};
pp$3.exitScope = function() {
  this.scopeStack.pop();
};
pp$3.treatFunctionsAsVarInScope = function(scope) {
  return scope.flags & SCOPE_FUNCTION || !this.inModule && scope.flags & SCOPE_TOP;
};
pp$3.declareName = function(name, bindingType, pos) {
  var redeclared = false;
  if (bindingType === BIND_LEXICAL) {
    var scope = this.currentScope();
    redeclared = scope.lexical.indexOf(name) > -1 || scope.functions.indexOf(name) > -1 || scope.var.indexOf(name) > -1;
    scope.lexical.push(name);
    if (this.inModule && scope.flags & SCOPE_TOP) {
      delete this.undefinedExports[name];
    }
  } else if (bindingType === BIND_SIMPLE_CATCH) {
    var scope$1 = this.currentScope();
    scope$1.lexical.push(name);
  } else if (bindingType === BIND_FUNCTION) {
    var scope$2 = this.currentScope();
    if (this.treatFunctionsAsVar) {
      redeclared = scope$2.lexical.indexOf(name) > -1;
    } else {
      redeclared = scope$2.lexical.indexOf(name) > -1 || scope$2.var.indexOf(name) > -1;
    }
    scope$2.functions.push(name);
  } else {
    for (var i = this.scopeStack.length - 1; i >= 0; --i) {
      var scope$3 = this.scopeStack[i];
      if (scope$3.lexical.indexOf(name) > -1 && !(scope$3.flags & SCOPE_SIMPLE_CATCH && scope$3.lexical[0] === name) || !this.treatFunctionsAsVarInScope(scope$3) && scope$3.functions.indexOf(name) > -1) {
        redeclared = true;
        break;
      }
      scope$3.var.push(name);
      if (this.inModule && scope$3.flags & SCOPE_TOP) {
        delete this.undefinedExports[name];
      }
      if (scope$3.flags & SCOPE_VAR) {
        break;
      }
    }
  }
  if (redeclared) {
    this.raiseRecoverable(pos, "Identifier '" + name + "' has already been declared");
  }
};
pp$3.checkLocalExport = function(id) {
  if (this.scopeStack[0].lexical.indexOf(id.name) === -1 && this.scopeStack[0].var.indexOf(id.name) === -1) {
    this.undefinedExports[id.name] = id;
  }
};
pp$3.currentScope = function() {
  return this.scopeStack[this.scopeStack.length - 1];
};
pp$3.currentVarScope = function() {
  for (var i = this.scopeStack.length - 1; ; i--) {
    var scope = this.scopeStack[i];
    if (scope.flags & SCOPE_VAR) {
      return scope;
    }
  }
};
pp$3.currentThisScope = function() {
  for (var i = this.scopeStack.length - 1; ; i--) {
    var scope = this.scopeStack[i];
    if (scope.flags & SCOPE_VAR && !(scope.flags & SCOPE_ARROW)) {
      return scope;
    }
  }
};
var Node$1 = function Node2(parser, pos, loc) {
  this.type = "";
  this.start = pos;
  this.end = 0;
  if (parser.options.locations) {
    this.loc = new SourceLocation(parser, loc);
  }
  if (parser.options.directSourceFile) {
    this.sourceFile = parser.options.directSourceFile;
  }
  if (parser.options.ranges) {
    this.range = [pos, 0];
  }
};
var pp$2 = Parser.prototype;
pp$2.startNode = function() {
  return new Node$1(this, this.start, this.startLoc);
};
pp$2.startNodeAt = function(pos, loc) {
  return new Node$1(this, pos, loc);
};
function finishNodeAt(node, type, pos, loc) {
  node.type = type;
  node.end = pos;
  if (this.options.locations) {
    node.loc.end = loc;
  }
  if (this.options.ranges) {
    node.range[1] = pos;
  }
  return node;
}
pp$2.finishNode = function(node, type) {
  return finishNodeAt.call(this, node, type, this.lastTokEnd, this.lastTokEndLoc);
};
pp$2.finishNodeAt = function(node, type, pos, loc) {
  return finishNodeAt.call(this, node, type, pos, loc);
};
pp$2.copyNode = function(node) {
  var newNode = new Node$1(this, node.start, this.startLoc);
  for (var prop2 in node) {
    newNode[prop2] = node[prop2];
  }
  return newNode;
};
var ecma9BinaryProperties = "ASCII ASCII_Hex_Digit AHex Alphabetic Alpha Any Assigned Bidi_Control Bidi_C Bidi_Mirrored Bidi_M Case_Ignorable CI Cased Changes_When_Casefolded CWCF Changes_When_Casemapped CWCM Changes_When_Lowercased CWL Changes_When_NFKC_Casefolded CWKCF Changes_When_Titlecased CWT Changes_When_Uppercased CWU Dash Default_Ignorable_Code_Point DI Deprecated Dep Diacritic Dia Emoji Emoji_Component Emoji_Modifier Emoji_Modifier_Base Emoji_Presentation Extender Ext Grapheme_Base Gr_Base Grapheme_Extend Gr_Ext Hex_Digit Hex IDS_Binary_Operator IDSB IDS_Trinary_Operator IDST ID_Continue IDC ID_Start IDS Ideographic Ideo Join_Control Join_C Logical_Order_Exception LOE Lowercase Lower Math Noncharacter_Code_Point NChar Pattern_Syntax Pat_Syn Pattern_White_Space Pat_WS Quotation_Mark QMark Radical Regional_Indicator RI Sentence_Terminal STerm Soft_Dotted SD Terminal_Punctuation Term Unified_Ideograph UIdeo Uppercase Upper Variation_Selector VS White_Space space XID_Continue XIDC XID_Start XIDS";
var ecma10BinaryProperties = ecma9BinaryProperties + " Extended_Pictographic";
var ecma11BinaryProperties = ecma10BinaryProperties;
var ecma12BinaryProperties = ecma11BinaryProperties + " EBase EComp EMod EPres ExtPict";
var ecma13BinaryProperties = ecma12BinaryProperties;
var ecma14BinaryProperties = ecma13BinaryProperties;
var unicodeBinaryProperties = {
  9: ecma9BinaryProperties,
  10: ecma10BinaryProperties,
  11: ecma11BinaryProperties,
  12: ecma12BinaryProperties,
  13: ecma13BinaryProperties,
  14: ecma14BinaryProperties
};
var ecma14BinaryPropertiesOfStrings = "Basic_Emoji Emoji_Keycap_Sequence RGI_Emoji_Modifier_Sequence RGI_Emoji_Flag_Sequence RGI_Emoji_Tag_Sequence RGI_Emoji_ZWJ_Sequence RGI_Emoji";
var unicodeBinaryPropertiesOfStrings = {
  9: "",
  10: "",
  11: "",
  12: "",
  13: "",
  14: ecma14BinaryPropertiesOfStrings
};
var unicodeGeneralCategoryValues = "Cased_Letter LC Close_Punctuation Pe Connector_Punctuation Pc Control Cc cntrl Currency_Symbol Sc Dash_Punctuation Pd Decimal_Number Nd digit Enclosing_Mark Me Final_Punctuation Pf Format Cf Initial_Punctuation Pi Letter L Letter_Number Nl Line_Separator Zl Lowercase_Letter Ll Mark M Combining_Mark Math_Symbol Sm Modifier_Letter Lm Modifier_Symbol Sk Nonspacing_Mark Mn Number N Open_Punctuation Ps Other C Other_Letter Lo Other_Number No Other_Punctuation Po Other_Symbol So Paragraph_Separator Zp Private_Use Co Punctuation P punct Separator Z Space_Separator Zs Spacing_Mark Mc Surrogate Cs Symbol S Titlecase_Letter Lt Unassigned Cn Uppercase_Letter Lu";
var ecma9ScriptValues = "Adlam Adlm Ahom Anatolian_Hieroglyphs Hluw Arabic Arab Armenian Armn Avestan Avst Balinese Bali Bamum Bamu Bassa_Vah Bass Batak Batk Bengali Beng Bhaiksuki Bhks Bopomofo Bopo Brahmi Brah Braille Brai Buginese Bugi Buhid Buhd Canadian_Aboriginal Cans Carian Cari Caucasian_Albanian Aghb Chakma Cakm Cham Cham Cherokee Cher Common Zyyy Coptic Copt Qaac Cuneiform Xsux Cypriot Cprt Cyrillic Cyrl Deseret Dsrt Devanagari Deva Duployan Dupl Egyptian_Hieroglyphs Egyp Elbasan Elba Ethiopic Ethi Georgian Geor Glagolitic Glag Gothic Goth Grantha Gran Greek Grek Gujarati Gujr Gurmukhi Guru Han Hani Hangul Hang Hanunoo Hano Hatran Hatr Hebrew Hebr Hiragana Hira Imperial_Aramaic Armi Inherited Zinh Qaai Inscriptional_Pahlavi Phli Inscriptional_Parthian Prti Javanese Java Kaithi Kthi Kannada Knda Katakana Kana Kayah_Li Kali Kharoshthi Khar Khmer Khmr Khojki Khoj Khudawadi Sind Lao Laoo Latin Latn Lepcha Lepc Limbu Limb Linear_A Lina Linear_B Linb Lisu Lisu Lycian Lyci Lydian Lydi Mahajani Mahj Malayalam Mlym Mandaic Mand Manichaean Mani Marchen Marc Masaram_Gondi Gonm Meetei_Mayek Mtei Mende_Kikakui Mend Meroitic_Cursive Merc Meroitic_Hieroglyphs Mero Miao Plrd Modi Mongolian Mong Mro Mroo Multani Mult Myanmar Mymr Nabataean Nbat New_Tai_Lue Talu Newa Newa Nko Nkoo Nushu Nshu Ogham Ogam Ol_Chiki Olck Old_Hungarian Hung Old_Italic Ital Old_North_Arabian Narb Old_Permic Perm Old_Persian Xpeo Old_South_Arabian Sarb Old_Turkic Orkh Oriya Orya Osage Osge Osmanya Osma Pahawh_Hmong Hmng Palmyrene Palm Pau_Cin_Hau Pauc Phags_Pa Phag Phoenician Phnx Psalter_Pahlavi Phlp Rejang Rjng Runic Runr Samaritan Samr Saurashtra Saur Sharada Shrd Shavian Shaw Siddham Sidd SignWriting Sgnw Sinhala Sinh Sora_Sompeng Sora Soyombo Soyo Sundanese Sund Syloti_Nagri Sylo Syriac Syrc Tagalog Tglg Tagbanwa Tagb Tai_Le Tale Tai_Tham Lana Tai_Viet Tavt Takri Takr Tamil Taml Tangut Tang Telugu Telu Thaana Thaa Thai Thai Tibetan Tibt Tifinagh Tfng Tirhuta Tirh Ugaritic Ugar Vai Vaii Warang_Citi Wara Yi Yiii Zanabazar_Square Zanb";
var ecma10ScriptValues = ecma9ScriptValues + " Dogra Dogr Gunjala_Gondi Gong Hanifi_Rohingya Rohg Makasar Maka Medefaidrin Medf Old_Sogdian Sogo Sogdian Sogd";
var ecma11ScriptValues = ecma10ScriptValues + " Elymaic Elym Nandinagari Nand Nyiakeng_Puachue_Hmong Hmnp Wancho Wcho";
var ecma12ScriptValues = ecma11ScriptValues + " Chorasmian Chrs Diak Dives_Akuru Khitan_Small_Script Kits Yezi Yezidi";
var ecma13ScriptValues = ecma12ScriptValues + " Cypro_Minoan Cpmn Old_Uyghur Ougr Tangsa Tnsa Toto Vithkuqi Vith";
var ecma14ScriptValues = ecma13ScriptValues + " Hrkt Katakana_Or_Hiragana Kawi Nag_Mundari Nagm Unknown Zzzz";
var unicodeScriptValues = {
  9: ecma9ScriptValues,
  10: ecma10ScriptValues,
  11: ecma11ScriptValues,
  12: ecma12ScriptValues,
  13: ecma13ScriptValues,
  14: ecma14ScriptValues
};
var data = {};
function buildUnicodeData(ecmaVersion) {
  var d2 = data[ecmaVersion] = {
    binary: wordsRegexp(unicodeBinaryProperties[ecmaVersion] + " " + unicodeGeneralCategoryValues),
    binaryOfStrings: wordsRegexp(unicodeBinaryPropertiesOfStrings[ecmaVersion]),
    nonBinary: {
      General_Category: wordsRegexp(unicodeGeneralCategoryValues),
      Script: wordsRegexp(unicodeScriptValues[ecmaVersion])
    }
  };
  d2.nonBinary.Script_Extensions = d2.nonBinary.Script;
  d2.nonBinary.gc = d2.nonBinary.General_Category;
  d2.nonBinary.sc = d2.nonBinary.Script;
  d2.nonBinary.scx = d2.nonBinary.Script_Extensions;
}
for (var i$2 = 0, list$1 = [9, 10, 11, 12, 13, 14]; i$2 < list$1.length; i$2 += 1) {
  var ecmaVersion = list$1[i$2];
  buildUnicodeData(ecmaVersion);
}
var pp$1 = Parser.prototype;
var BranchID = function BranchID2(parent, base) {
  this.parent = parent;
  this.base = base || this;
};
BranchID.prototype.separatedFrom = function separatedFrom(alt) {
  for (var self2 = this; self2; self2 = self2.parent) {
    for (var other = alt; other; other = other.parent) {
      if (self2.base === other.base && self2 !== other) {
        return true;
      }
    }
  }
  return false;
};
BranchID.prototype.sibling = function sibling() {
  return new BranchID(this.parent, this.base);
};
var RegExpValidationState = function RegExpValidationState2(parser) {
  this.parser = parser;
  this.validFlags = "gim" + (parser.options.ecmaVersion >= 6 ? "uy" : "") + (parser.options.ecmaVersion >= 9 ? "s" : "") + (parser.options.ecmaVersion >= 13 ? "d" : "") + (parser.options.ecmaVersion >= 15 ? "v" : "");
  this.unicodeProperties = data[parser.options.ecmaVersion >= 14 ? 14 : parser.options.ecmaVersion];
  this.source = "";
  this.flags = "";
  this.start = 0;
  this.switchU = false;
  this.switchV = false;
  this.switchN = false;
  this.pos = 0;
  this.lastIntValue = 0;
  this.lastStringValue = "";
  this.lastAssertionIsQuantifiable = false;
  this.numCapturingParens = 0;
  this.maxBackReference = 0;
  this.groupNames = /* @__PURE__ */ Object.create(null);
  this.backReferenceNames = [];
  this.branchID = null;
};
RegExpValidationState.prototype.reset = function reset(start, pattern, flags) {
  var unicodeSets = flags.indexOf("v") !== -1;
  var unicode = flags.indexOf("u") !== -1;
  this.start = start | 0;
  this.source = pattern + "";
  this.flags = flags;
  if (unicodeSets && this.parser.options.ecmaVersion >= 15) {
    this.switchU = true;
    this.switchV = true;
    this.switchN = true;
  } else {
    this.switchU = unicode && this.parser.options.ecmaVersion >= 6;
    this.switchV = false;
    this.switchN = unicode && this.parser.options.ecmaVersion >= 9;
  }
};
RegExpValidationState.prototype.raise = function raise(message) {
  this.parser.raiseRecoverable(this.start, "Invalid regular expression: /" + this.source + "/: " + message);
};
RegExpValidationState.prototype.at = function at(i, forceU) {
  if (forceU === void 0) forceU = false;
  var s = this.source;
  var l2 = s.length;
  if (i >= l2) {
    return -1;
  }
  var c2 = s.charCodeAt(i);
  if (!(forceU || this.switchU) || c2 <= 55295 || c2 >= 57344 || i + 1 >= l2) {
    return c2;
  }
  var next = s.charCodeAt(i + 1);
  return next >= 56320 && next <= 57343 ? (c2 << 10) + next - 56613888 : c2;
};
RegExpValidationState.prototype.nextIndex = function nextIndex(i, forceU) {
  if (forceU === void 0) forceU = false;
  var s = this.source;
  var l2 = s.length;
  if (i >= l2) {
    return l2;
  }
  var c2 = s.charCodeAt(i), next;
  if (!(forceU || this.switchU) || c2 <= 55295 || c2 >= 57344 || i + 1 >= l2 || (next = s.charCodeAt(i + 1)) < 56320 || next > 57343) {
    return i + 1;
  }
  return i + 2;
};
RegExpValidationState.prototype.current = function current(forceU) {
  if (forceU === void 0) forceU = false;
  return this.at(this.pos, forceU);
};
RegExpValidationState.prototype.lookahead = function lookahead(forceU) {
  if (forceU === void 0) forceU = false;
  return this.at(this.nextIndex(this.pos, forceU), forceU);
};
RegExpValidationState.prototype.advance = function advance(forceU) {
  if (forceU === void 0) forceU = false;
  this.pos = this.nextIndex(this.pos, forceU);
};
RegExpValidationState.prototype.eat = function eat(ch, forceU) {
  if (forceU === void 0) forceU = false;
  if (this.current(forceU) === ch) {
    this.advance(forceU);
    return true;
  }
  return false;
};
RegExpValidationState.prototype.eatChars = function eatChars(chs, forceU) {
  if (forceU === void 0) forceU = false;
  var pos = this.pos;
  for (var i = 0, list2 = chs; i < list2.length; i += 1) {
    var ch = list2[i];
    var current2 = this.at(pos, forceU);
    if (current2 === -1 || current2 !== ch) {
      return false;
    }
    pos = this.nextIndex(pos, forceU);
  }
  this.pos = pos;
  return true;
};
pp$1.validateRegExpFlags = function(state2) {
  var validFlags = state2.validFlags;
  var flags = state2.flags;
  var u2 = false;
  var v2 = false;
  for (var i = 0; i < flags.length; i++) {
    var flag = flags.charAt(i);
    if (validFlags.indexOf(flag) === -1) {
      this.raise(state2.start, "Invalid regular expression flag");
    }
    if (flags.indexOf(flag, i + 1) > -1) {
      this.raise(state2.start, "Duplicate regular expression flag");
    }
    if (flag === "u") {
      u2 = true;
    }
    if (flag === "v") {
      v2 = true;
    }
  }
  if (this.options.ecmaVersion >= 15 && u2 && v2) {
    this.raise(state2.start, "Invalid regular expression flag");
  }
};
function hasProp(obj) {
  for (var _ in obj) {
    return true;
  }
  return false;
}
pp$1.validateRegExpPattern = function(state2) {
  this.regexp_pattern(state2);
  if (!state2.switchN && this.options.ecmaVersion >= 9 && hasProp(state2.groupNames)) {
    state2.switchN = true;
    this.regexp_pattern(state2);
  }
};
pp$1.regexp_pattern = function(state2) {
  state2.pos = 0;
  state2.lastIntValue = 0;
  state2.lastStringValue = "";
  state2.lastAssertionIsQuantifiable = false;
  state2.numCapturingParens = 0;
  state2.maxBackReference = 0;
  state2.groupNames = /* @__PURE__ */ Object.create(null);
  state2.backReferenceNames.length = 0;
  state2.branchID = null;
  this.regexp_disjunction(state2);
  if (state2.pos !== state2.source.length) {
    if (state2.eat(
      41
      /* ) */
    )) {
      state2.raise("Unmatched ')'");
    }
    if (state2.eat(
      93
      /* ] */
    ) || state2.eat(
      125
      /* } */
    )) {
      state2.raise("Lone quantifier brackets");
    }
  }
  if (state2.maxBackReference > state2.numCapturingParens) {
    state2.raise("Invalid escape");
  }
  for (var i = 0, list2 = state2.backReferenceNames; i < list2.length; i += 1) {
    var name = list2[i];
    if (!state2.groupNames[name]) {
      state2.raise("Invalid named capture referenced");
    }
  }
};
pp$1.regexp_disjunction = function(state2) {
  var trackDisjunction = this.options.ecmaVersion >= 16;
  if (trackDisjunction) {
    state2.branchID = new BranchID(state2.branchID, null);
  }
  this.regexp_alternative(state2);
  while (state2.eat(
    124
    /* | */
  )) {
    if (trackDisjunction) {
      state2.branchID = state2.branchID.sibling();
    }
    this.regexp_alternative(state2);
  }
  if (trackDisjunction) {
    state2.branchID = state2.branchID.parent;
  }
  if (this.regexp_eatQuantifier(state2, true)) {
    state2.raise("Nothing to repeat");
  }
  if (state2.eat(
    123
    /* { */
  )) {
    state2.raise("Lone quantifier brackets");
  }
};
pp$1.regexp_alternative = function(state2) {
  while (state2.pos < state2.source.length && this.regexp_eatTerm(state2)) {
  }
};
pp$1.regexp_eatTerm = function(state2) {
  if (this.regexp_eatAssertion(state2)) {
    if (state2.lastAssertionIsQuantifiable && this.regexp_eatQuantifier(state2)) {
      if (state2.switchU) {
        state2.raise("Invalid quantifier");
      }
    }
    return true;
  }
  if (state2.switchU ? this.regexp_eatAtom(state2) : this.regexp_eatExtendedAtom(state2)) {
    this.regexp_eatQuantifier(state2);
    return true;
  }
  return false;
};
pp$1.regexp_eatAssertion = function(state2) {
  var start = state2.pos;
  state2.lastAssertionIsQuantifiable = false;
  if (state2.eat(
    94
    /* ^ */
  ) || state2.eat(
    36
    /* $ */
  )) {
    return true;
  }
  if (state2.eat(
    92
    /* \ */
  )) {
    if (state2.eat(
      66
      /* B */
    ) || state2.eat(
      98
      /* b */
    )) {
      return true;
    }
    state2.pos = start;
  }
  if (state2.eat(
    40
    /* ( */
  ) && state2.eat(
    63
    /* ? */
  )) {
    var lookbehind = false;
    if (this.options.ecmaVersion >= 9) {
      lookbehind = state2.eat(
        60
        /* < */
      );
    }
    if (state2.eat(
      61
      /* = */
    ) || state2.eat(
      33
      /* ! */
    )) {
      this.regexp_disjunction(state2);
      if (!state2.eat(
        41
        /* ) */
      )) {
        state2.raise("Unterminated group");
      }
      state2.lastAssertionIsQuantifiable = !lookbehind;
      return true;
    }
  }
  state2.pos = start;
  return false;
};
pp$1.regexp_eatQuantifier = function(state2, noError) {
  if (noError === void 0) noError = false;
  if (this.regexp_eatQuantifierPrefix(state2, noError)) {
    state2.eat(
      63
      /* ? */
    );
    return true;
  }
  return false;
};
pp$1.regexp_eatQuantifierPrefix = function(state2, noError) {
  return state2.eat(
    42
    /* * */
  ) || state2.eat(
    43
    /* + */
  ) || state2.eat(
    63
    /* ? */
  ) || this.regexp_eatBracedQuantifier(state2, noError);
};
pp$1.regexp_eatBracedQuantifier = function(state2, noError) {
  var start = state2.pos;
  if (state2.eat(
    123
    /* { */
  )) {
    var min = 0, max = -1;
    if (this.regexp_eatDecimalDigits(state2)) {
      min = state2.lastIntValue;
      if (state2.eat(
        44
        /* , */
      ) && this.regexp_eatDecimalDigits(state2)) {
        max = state2.lastIntValue;
      }
      if (state2.eat(
        125
        /* } */
      )) {
        if (max !== -1 && max < min && !noError) {
          state2.raise("numbers out of order in {} quantifier");
        }
        return true;
      }
    }
    if (state2.switchU && !noError) {
      state2.raise("Incomplete quantifier");
    }
    state2.pos = start;
  }
  return false;
};
pp$1.regexp_eatAtom = function(state2) {
  return this.regexp_eatPatternCharacters(state2) || state2.eat(
    46
    /* . */
  ) || this.regexp_eatReverseSolidusAtomEscape(state2) || this.regexp_eatCharacterClass(state2) || this.regexp_eatUncapturingGroup(state2) || this.regexp_eatCapturingGroup(state2);
};
pp$1.regexp_eatReverseSolidusAtomEscape = function(state2) {
  var start = state2.pos;
  if (state2.eat(
    92
    /* \ */
  )) {
    if (this.regexp_eatAtomEscape(state2)) {
      return true;
    }
    state2.pos = start;
  }
  return false;
};
pp$1.regexp_eatUncapturingGroup = function(state2) {
  var start = state2.pos;
  if (state2.eat(
    40
    /* ( */
  )) {
    if (state2.eat(
      63
      /* ? */
    ) && state2.eat(
      58
      /* : */
    )) {
      this.regexp_disjunction(state2);
      if (state2.eat(
        41
        /* ) */
      )) {
        return true;
      }
      state2.raise("Unterminated group");
    }
    state2.pos = start;
  }
  return false;
};
pp$1.regexp_eatCapturingGroup = function(state2) {
  if (state2.eat(
    40
    /* ( */
  )) {
    if (this.options.ecmaVersion >= 9) {
      this.regexp_groupSpecifier(state2);
    } else if (state2.current() === 63) {
      state2.raise("Invalid group");
    }
    this.regexp_disjunction(state2);
    if (state2.eat(
      41
      /* ) */
    )) {
      state2.numCapturingParens += 1;
      return true;
    }
    state2.raise("Unterminated group");
  }
  return false;
};
pp$1.regexp_eatExtendedAtom = function(state2) {
  return state2.eat(
    46
    /* . */
  ) || this.regexp_eatReverseSolidusAtomEscape(state2) || this.regexp_eatCharacterClass(state2) || this.regexp_eatUncapturingGroup(state2) || this.regexp_eatCapturingGroup(state2) || this.regexp_eatInvalidBracedQuantifier(state2) || this.regexp_eatExtendedPatternCharacter(state2);
};
pp$1.regexp_eatInvalidBracedQuantifier = function(state2) {
  if (this.regexp_eatBracedQuantifier(state2, true)) {
    state2.raise("Nothing to repeat");
  }
  return false;
};
pp$1.regexp_eatSyntaxCharacter = function(state2) {
  var ch = state2.current();
  if (isSyntaxCharacter(ch)) {
    state2.lastIntValue = ch;
    state2.advance();
    return true;
  }
  return false;
};
function isSyntaxCharacter(ch) {
  return ch === 36 || ch >= 40 && ch <= 43 || ch === 46 || ch === 63 || ch >= 91 && ch <= 94 || ch >= 123 && ch <= 125;
}
pp$1.regexp_eatPatternCharacters = function(state2) {
  var start = state2.pos;
  var ch = 0;
  while ((ch = state2.current()) !== -1 && !isSyntaxCharacter(ch)) {
    state2.advance();
  }
  return state2.pos !== start;
};
pp$1.regexp_eatExtendedPatternCharacter = function(state2) {
  var ch = state2.current();
  if (ch !== -1 && ch !== 36 && !(ch >= 40 && ch <= 43) && ch !== 46 && ch !== 63 && ch !== 91 && ch !== 94 && ch !== 124) {
    state2.advance();
    return true;
  }
  return false;
};
pp$1.regexp_groupSpecifier = function(state2) {
  if (state2.eat(
    63
    /* ? */
  )) {
    if (!this.regexp_eatGroupName(state2)) {
      state2.raise("Invalid group");
    }
    var trackDisjunction = this.options.ecmaVersion >= 16;
    var known = state2.groupNames[state2.lastStringValue];
    if (known) {
      if (trackDisjunction) {
        for (var i = 0, list2 = known; i < list2.length; i += 1) {
          var altID = list2[i];
          if (!altID.separatedFrom(state2.branchID)) {
            state2.raise("Duplicate capture group name");
          }
        }
      } else {
        state2.raise("Duplicate capture group name");
      }
    }
    if (trackDisjunction) {
      (known || (state2.groupNames[state2.lastStringValue] = [])).push(state2.branchID);
    } else {
      state2.groupNames[state2.lastStringValue] = true;
    }
  }
};
pp$1.regexp_eatGroupName = function(state2) {
  state2.lastStringValue = "";
  if (state2.eat(
    60
    /* < */
  )) {
    if (this.regexp_eatRegExpIdentifierName(state2) && state2.eat(
      62
      /* > */
    )) {
      return true;
    }
    state2.raise("Invalid capture group name");
  }
  return false;
};
pp$1.regexp_eatRegExpIdentifierName = function(state2) {
  state2.lastStringValue = "";
  if (this.regexp_eatRegExpIdentifierStart(state2)) {
    state2.lastStringValue += codePointToString(state2.lastIntValue);
    while (this.regexp_eatRegExpIdentifierPart(state2)) {
      state2.lastStringValue += codePointToString(state2.lastIntValue);
    }
    return true;
  }
  return false;
};
pp$1.regexp_eatRegExpIdentifierStart = function(state2) {
  var start = state2.pos;
  var forceU = this.options.ecmaVersion >= 11;
  var ch = state2.current(forceU);
  state2.advance(forceU);
  if (ch === 92 && this.regexp_eatRegExpUnicodeEscapeSequence(state2, forceU)) {
    ch = state2.lastIntValue;
  }
  if (isRegExpIdentifierStart(ch)) {
    state2.lastIntValue = ch;
    return true;
  }
  state2.pos = start;
  return false;
};
function isRegExpIdentifierStart(ch) {
  return isIdentifierStart(ch, true) || ch === 36 || ch === 95;
}
pp$1.regexp_eatRegExpIdentifierPart = function(state2) {
  var start = state2.pos;
  var forceU = this.options.ecmaVersion >= 11;
  var ch = state2.current(forceU);
  state2.advance(forceU);
  if (ch === 92 && this.regexp_eatRegExpUnicodeEscapeSequence(state2, forceU)) {
    ch = state2.lastIntValue;
  }
  if (isRegExpIdentifierPart(ch)) {
    state2.lastIntValue = ch;
    return true;
  }
  state2.pos = start;
  return false;
};
function isRegExpIdentifierPart(ch) {
  return isIdentifierChar(ch, true) || ch === 36 || ch === 95 || ch === 8204 || ch === 8205;
}
pp$1.regexp_eatAtomEscape = function(state2) {
  if (this.regexp_eatBackReference(state2) || this.regexp_eatCharacterClassEscape(state2) || this.regexp_eatCharacterEscape(state2) || state2.switchN && this.regexp_eatKGroupName(state2)) {
    return true;
  }
  if (state2.switchU) {
    if (state2.current() === 99) {
      state2.raise("Invalid unicode escape");
    }
    state2.raise("Invalid escape");
  }
  return false;
};
pp$1.regexp_eatBackReference = function(state2) {
  var start = state2.pos;
  if (this.regexp_eatDecimalEscape(state2)) {
    var n2 = state2.lastIntValue;
    if (state2.switchU) {
      if (n2 > state2.maxBackReference) {
        state2.maxBackReference = n2;
      }
      return true;
    }
    if (n2 <= state2.numCapturingParens) {
      return true;
    }
    state2.pos = start;
  }
  return false;
};
pp$1.regexp_eatKGroupName = function(state2) {
  if (state2.eat(
    107
    /* k */
  )) {
    if (this.regexp_eatGroupName(state2)) {
      state2.backReferenceNames.push(state2.lastStringValue);
      return true;
    }
    state2.raise("Invalid named reference");
  }
  return false;
};
pp$1.regexp_eatCharacterEscape = function(state2) {
  return this.regexp_eatControlEscape(state2) || this.regexp_eatCControlLetter(state2) || this.regexp_eatZero(state2) || this.regexp_eatHexEscapeSequence(state2) || this.regexp_eatRegExpUnicodeEscapeSequence(state2, false) || !state2.switchU && this.regexp_eatLegacyOctalEscapeSequence(state2) || this.regexp_eatIdentityEscape(state2);
};
pp$1.regexp_eatCControlLetter = function(state2) {
  var start = state2.pos;
  if (state2.eat(
    99
    /* c */
  )) {
    if (this.regexp_eatControlLetter(state2)) {
      return true;
    }
    state2.pos = start;
  }
  return false;
};
pp$1.regexp_eatZero = function(state2) {
  if (state2.current() === 48 && !isDecimalDigit(state2.lookahead())) {
    state2.lastIntValue = 0;
    state2.advance();
    return true;
  }
  return false;
};
pp$1.regexp_eatControlEscape = function(state2) {
  var ch = state2.current();
  if (ch === 116) {
    state2.lastIntValue = 9;
    state2.advance();
    return true;
  }
  if (ch === 110) {
    state2.lastIntValue = 10;
    state2.advance();
    return true;
  }
  if (ch === 118) {
    state2.lastIntValue = 11;
    state2.advance();
    return true;
  }
  if (ch === 102) {
    state2.lastIntValue = 12;
    state2.advance();
    return true;
  }
  if (ch === 114) {
    state2.lastIntValue = 13;
    state2.advance();
    return true;
  }
  return false;
};
pp$1.regexp_eatControlLetter = function(state2) {
  var ch = state2.current();
  if (isControlLetter(ch)) {
    state2.lastIntValue = ch % 32;
    state2.advance();
    return true;
  }
  return false;
};
function isControlLetter(ch) {
  return ch >= 65 && ch <= 90 || ch >= 97 && ch <= 122;
}
pp$1.regexp_eatRegExpUnicodeEscapeSequence = function(state2, forceU) {
  if (forceU === void 0) forceU = false;
  var start = state2.pos;
  var switchU = forceU || state2.switchU;
  if (state2.eat(
    117
    /* u */
  )) {
    if (this.regexp_eatFixedHexDigits(state2, 4)) {
      var lead = state2.lastIntValue;
      if (switchU && lead >= 55296 && lead <= 56319) {
        var leadSurrogateEnd = state2.pos;
        if (state2.eat(
          92
          /* \ */
        ) && state2.eat(
          117
          /* u */
        ) && this.regexp_eatFixedHexDigits(state2, 4)) {
          var trail = state2.lastIntValue;
          if (trail >= 56320 && trail <= 57343) {
            state2.lastIntValue = (lead - 55296) * 1024 + (trail - 56320) + 65536;
            return true;
          }
        }
        state2.pos = leadSurrogateEnd;
        state2.lastIntValue = lead;
      }
      return true;
    }
    if (switchU && state2.eat(
      123
      /* { */
    ) && this.regexp_eatHexDigits(state2) && state2.eat(
      125
      /* } */
    ) && isValidUnicode(state2.lastIntValue)) {
      return true;
    }
    if (switchU) {
      state2.raise("Invalid unicode escape");
    }
    state2.pos = start;
  }
  return false;
};
function isValidUnicode(ch) {
  return ch >= 0 && ch <= 1114111;
}
pp$1.regexp_eatIdentityEscape = function(state2) {
  if (state2.switchU) {
    if (this.regexp_eatSyntaxCharacter(state2)) {
      return true;
    }
    if (state2.eat(
      47
      /* / */
    )) {
      state2.lastIntValue = 47;
      return true;
    }
    return false;
  }
  var ch = state2.current();
  if (ch !== 99 && (!state2.switchN || ch !== 107)) {
    state2.lastIntValue = ch;
    state2.advance();
    return true;
  }
  return false;
};
pp$1.regexp_eatDecimalEscape = function(state2) {
  state2.lastIntValue = 0;
  var ch = state2.current();
  if (ch >= 49 && ch <= 57) {
    do {
      state2.lastIntValue = 10 * state2.lastIntValue + (ch - 48);
      state2.advance();
    } while ((ch = state2.current()) >= 48 && ch <= 57);
    return true;
  }
  return false;
};
var CharSetNone = 0;
var CharSetOk = 1;
var CharSetString = 2;
pp$1.regexp_eatCharacterClassEscape = function(state2) {
  var ch = state2.current();
  if (isCharacterClassEscape(ch)) {
    state2.lastIntValue = -1;
    state2.advance();
    return CharSetOk;
  }
  var negate = false;
  if (state2.switchU && this.options.ecmaVersion >= 9 && ((negate = ch === 80) || ch === 112)) {
    state2.lastIntValue = -1;
    state2.advance();
    var result;
    if (state2.eat(
      123
      /* { */
    ) && (result = this.regexp_eatUnicodePropertyValueExpression(state2)) && state2.eat(
      125
      /* } */
    )) {
      if (negate && result === CharSetString) {
        state2.raise("Invalid property name");
      }
      return result;
    }
    state2.raise("Invalid property name");
  }
  return CharSetNone;
};
function isCharacterClassEscape(ch) {
  return ch === 100 || ch === 68 || ch === 115 || ch === 83 || ch === 119 || ch === 87;
}
pp$1.regexp_eatUnicodePropertyValueExpression = function(state2) {
  var start = state2.pos;
  if (this.regexp_eatUnicodePropertyName(state2) && state2.eat(
    61
    /* = */
  )) {
    var name = state2.lastStringValue;
    if (this.regexp_eatUnicodePropertyValue(state2)) {
      var value = state2.lastStringValue;
      this.regexp_validateUnicodePropertyNameAndValue(state2, name, value);
      return CharSetOk;
    }
  }
  state2.pos = start;
  if (this.regexp_eatLoneUnicodePropertyNameOrValue(state2)) {
    var nameOrValue = state2.lastStringValue;
    return this.regexp_validateUnicodePropertyNameOrValue(state2, nameOrValue);
  }
  return CharSetNone;
};
pp$1.regexp_validateUnicodePropertyNameAndValue = function(state2, name, value) {
  if (!hasOwn(state2.unicodeProperties.nonBinary, name)) {
    state2.raise("Invalid property name");
  }
  if (!state2.unicodeProperties.nonBinary[name].test(value)) {
    state2.raise("Invalid property value");
  }
};
pp$1.regexp_validateUnicodePropertyNameOrValue = function(state2, nameOrValue) {
  if (state2.unicodeProperties.binary.test(nameOrValue)) {
    return CharSetOk;
  }
  if (state2.switchV && state2.unicodeProperties.binaryOfStrings.test(nameOrValue)) {
    return CharSetString;
  }
  state2.raise("Invalid property name");
};
pp$1.regexp_eatUnicodePropertyName = function(state2) {
  var ch = 0;
  state2.lastStringValue = "";
  while (isUnicodePropertyNameCharacter(ch = state2.current())) {
    state2.lastStringValue += codePointToString(ch);
    state2.advance();
  }
  return state2.lastStringValue !== "";
};
function isUnicodePropertyNameCharacter(ch) {
  return isControlLetter(ch) || ch === 95;
}
pp$1.regexp_eatUnicodePropertyValue = function(state2) {
  var ch = 0;
  state2.lastStringValue = "";
  while (isUnicodePropertyValueCharacter(ch = state2.current())) {
    state2.lastStringValue += codePointToString(ch);
    state2.advance();
  }
  return state2.lastStringValue !== "";
};
function isUnicodePropertyValueCharacter(ch) {
  return isUnicodePropertyNameCharacter(ch) || isDecimalDigit(ch);
}
pp$1.regexp_eatLoneUnicodePropertyNameOrValue = function(state2) {
  return this.regexp_eatUnicodePropertyValue(state2);
};
pp$1.regexp_eatCharacterClass = function(state2) {
  if (state2.eat(
    91
    /* [ */
  )) {
    var negate = state2.eat(
      94
      /* ^ */
    );
    var result = this.regexp_classContents(state2);
    if (!state2.eat(
      93
      /* ] */
    )) {
      state2.raise("Unterminated character class");
    }
    if (negate && result === CharSetString) {
      state2.raise("Negated character class may contain strings");
    }
    return true;
  }
  return false;
};
pp$1.regexp_classContents = function(state2) {
  if (state2.current() === 93) {
    return CharSetOk;
  }
  if (state2.switchV) {
    return this.regexp_classSetExpression(state2);
  }
  this.regexp_nonEmptyClassRanges(state2);
  return CharSetOk;
};
pp$1.regexp_nonEmptyClassRanges = function(state2) {
  while (this.regexp_eatClassAtom(state2)) {
    var left = state2.lastIntValue;
    if (state2.eat(
      45
      /* - */
    ) && this.regexp_eatClassAtom(state2)) {
      var right = state2.lastIntValue;
      if (state2.switchU && (left === -1 || right === -1)) {
        state2.raise("Invalid character class");
      }
      if (left !== -1 && right !== -1 && left > right) {
        state2.raise("Range out of order in character class");
      }
    }
  }
};
pp$1.regexp_eatClassAtom = function(state2) {
  var start = state2.pos;
  if (state2.eat(
    92
    /* \ */
  )) {
    if (this.regexp_eatClassEscape(state2)) {
      return true;
    }
    if (state2.switchU) {
      var ch$1 = state2.current();
      if (ch$1 === 99 || isOctalDigit(ch$1)) {
        state2.raise("Invalid class escape");
      }
      state2.raise("Invalid escape");
    }
    state2.pos = start;
  }
  var ch = state2.current();
  if (ch !== 93) {
    state2.lastIntValue = ch;
    state2.advance();
    return true;
  }
  return false;
};
pp$1.regexp_eatClassEscape = function(state2) {
  var start = state2.pos;
  if (state2.eat(
    98
    /* b */
  )) {
    state2.lastIntValue = 8;
    return true;
  }
  if (state2.switchU && state2.eat(
    45
    /* - */
  )) {
    state2.lastIntValue = 45;
    return true;
  }
  if (!state2.switchU && state2.eat(
    99
    /* c */
  )) {
    if (this.regexp_eatClassControlLetter(state2)) {
      return true;
    }
    state2.pos = start;
  }
  return this.regexp_eatCharacterClassEscape(state2) || this.regexp_eatCharacterEscape(state2);
};
pp$1.regexp_classSetExpression = function(state2) {
  var result = CharSetOk, subResult;
  if (this.regexp_eatClassSetRange(state2)) ;
  else if (subResult = this.regexp_eatClassSetOperand(state2)) {
    if (subResult === CharSetString) {
      result = CharSetString;
    }
    var start = state2.pos;
    while (state2.eatChars(
      [38, 38]
      /* && */
    )) {
      if (state2.current() !== 38 && (subResult = this.regexp_eatClassSetOperand(state2))) {
        if (subResult !== CharSetString) {
          result = CharSetOk;
        }
        continue;
      }
      state2.raise("Invalid character in character class");
    }
    if (start !== state2.pos) {
      return result;
    }
    while (state2.eatChars(
      [45, 45]
      /* -- */
    )) {
      if (this.regexp_eatClassSetOperand(state2)) {
        continue;
      }
      state2.raise("Invalid character in character class");
    }
    if (start !== state2.pos) {
      return result;
    }
  } else {
    state2.raise("Invalid character in character class");
  }
  for (; ; ) {
    if (this.regexp_eatClassSetRange(state2)) {
      continue;
    }
    subResult = this.regexp_eatClassSetOperand(state2);
    if (!subResult) {
      return result;
    }
    if (subResult === CharSetString) {
      result = CharSetString;
    }
  }
};
pp$1.regexp_eatClassSetRange = function(state2) {
  var start = state2.pos;
  if (this.regexp_eatClassSetCharacter(state2)) {
    var left = state2.lastIntValue;
    if (state2.eat(
      45
      /* - */
    ) && this.regexp_eatClassSetCharacter(state2)) {
      var right = state2.lastIntValue;
      if (left !== -1 && right !== -1 && left > right) {
        state2.raise("Range out of order in character class");
      }
      return true;
    }
    state2.pos = start;
  }
  return false;
};
pp$1.regexp_eatClassSetOperand = function(state2) {
  if (this.regexp_eatClassSetCharacter(state2)) {
    return CharSetOk;
  }
  return this.regexp_eatClassStringDisjunction(state2) || this.regexp_eatNestedClass(state2);
};
pp$1.regexp_eatNestedClass = function(state2) {
  var start = state2.pos;
  if (state2.eat(
    91
    /* [ */
  )) {
    var negate = state2.eat(
      94
      /* ^ */
    );
    var result = this.regexp_classContents(state2);
    if (state2.eat(
      93
      /* ] */
    )) {
      if (negate && result === CharSetString) {
        state2.raise("Negated character class may contain strings");
      }
      return result;
    }
    state2.pos = start;
  }
  if (state2.eat(
    92
    /* \ */
  )) {
    var result$1 = this.regexp_eatCharacterClassEscape(state2);
    if (result$1) {
      return result$1;
    }
    state2.pos = start;
  }
  return null;
};
pp$1.regexp_eatClassStringDisjunction = function(state2) {
  var start = state2.pos;
  if (state2.eatChars(
    [92, 113]
    /* \q */
  )) {
    if (state2.eat(
      123
      /* { */
    )) {
      var result = this.regexp_classStringDisjunctionContents(state2);
      if (state2.eat(
        125
        /* } */
      )) {
        return result;
      }
    } else {
      state2.raise("Invalid escape");
    }
    state2.pos = start;
  }
  return null;
};
pp$1.regexp_classStringDisjunctionContents = function(state2) {
  var result = this.regexp_classString(state2);
  while (state2.eat(
    124
    /* | */
  )) {
    if (this.regexp_classString(state2) === CharSetString) {
      result = CharSetString;
    }
  }
  return result;
};
pp$1.regexp_classString = function(state2) {
  var count = 0;
  while (this.regexp_eatClassSetCharacter(state2)) {
    count++;
  }
  return count === 1 ? CharSetOk : CharSetString;
};
pp$1.regexp_eatClassSetCharacter = function(state2) {
  var start = state2.pos;
  if (state2.eat(
    92
    /* \ */
  )) {
    if (this.regexp_eatCharacterEscape(state2) || this.regexp_eatClassSetReservedPunctuator(state2)) {
      return true;
    }
    if (state2.eat(
      98
      /* b */
    )) {
      state2.lastIntValue = 8;
      return true;
    }
    state2.pos = start;
    return false;
  }
  var ch = state2.current();
  if (ch < 0 || ch === state2.lookahead() && isClassSetReservedDoublePunctuatorCharacter(ch)) {
    return false;
  }
  if (isClassSetSyntaxCharacter(ch)) {
    return false;
  }
  state2.advance();
  state2.lastIntValue = ch;
  return true;
};
function isClassSetReservedDoublePunctuatorCharacter(ch) {
  return ch === 33 || ch >= 35 && ch <= 38 || ch >= 42 && ch <= 44 || ch === 46 || ch >= 58 && ch <= 64 || ch === 94 || ch === 96 || ch === 126;
}
function isClassSetSyntaxCharacter(ch) {
  return ch === 40 || ch === 41 || ch === 45 || ch === 47 || ch >= 91 && ch <= 93 || ch >= 123 && ch <= 125;
}
pp$1.regexp_eatClassSetReservedPunctuator = function(state2) {
  var ch = state2.current();
  if (isClassSetReservedPunctuator(ch)) {
    state2.lastIntValue = ch;
    state2.advance();
    return true;
  }
  return false;
};
function isClassSetReservedPunctuator(ch) {
  return ch === 33 || ch === 35 || ch === 37 || ch === 38 || ch === 44 || ch === 45 || ch >= 58 && ch <= 62 || ch === 64 || ch === 96 || ch === 126;
}
pp$1.regexp_eatClassControlLetter = function(state2) {
  var ch = state2.current();
  if (isDecimalDigit(ch) || ch === 95) {
    state2.lastIntValue = ch % 32;
    state2.advance();
    return true;
  }
  return false;
};
pp$1.regexp_eatHexEscapeSequence = function(state2) {
  var start = state2.pos;
  if (state2.eat(
    120
    /* x */
  )) {
    if (this.regexp_eatFixedHexDigits(state2, 2)) {
      return true;
    }
    if (state2.switchU) {
      state2.raise("Invalid escape");
    }
    state2.pos = start;
  }
  return false;
};
pp$1.regexp_eatDecimalDigits = function(state2) {
  var start = state2.pos;
  var ch = 0;
  state2.lastIntValue = 0;
  while (isDecimalDigit(ch = state2.current())) {
    state2.lastIntValue = 10 * state2.lastIntValue + (ch - 48);
    state2.advance();
  }
  return state2.pos !== start;
};
function isDecimalDigit(ch) {
  return ch >= 48 && ch <= 57;
}
pp$1.regexp_eatHexDigits = function(state2) {
  var start = state2.pos;
  var ch = 0;
  state2.lastIntValue = 0;
  while (isHexDigit(ch = state2.current())) {
    state2.lastIntValue = 16 * state2.lastIntValue + hexToInt(ch);
    state2.advance();
  }
  return state2.pos !== start;
};
function isHexDigit(ch) {
  return ch >= 48 && ch <= 57 || ch >= 65 && ch <= 70 || ch >= 97 && ch <= 102;
}
function hexToInt(ch) {
  if (ch >= 65 && ch <= 70) {
    return 10 + (ch - 65);
  }
  if (ch >= 97 && ch <= 102) {
    return 10 + (ch - 97);
  }
  return ch - 48;
}
pp$1.regexp_eatLegacyOctalEscapeSequence = function(state2) {
  if (this.regexp_eatOctalDigit(state2)) {
    var n1 = state2.lastIntValue;
    if (this.regexp_eatOctalDigit(state2)) {
      var n2 = state2.lastIntValue;
      if (n1 <= 3 && this.regexp_eatOctalDigit(state2)) {
        state2.lastIntValue = n1 * 64 + n2 * 8 + state2.lastIntValue;
      } else {
        state2.lastIntValue = n1 * 8 + n2;
      }
    } else {
      state2.lastIntValue = n1;
    }
    return true;
  }
  return false;
};
pp$1.regexp_eatOctalDigit = function(state2) {
  var ch = state2.current();
  if (isOctalDigit(ch)) {
    state2.lastIntValue = ch - 48;
    state2.advance();
    return true;
  }
  state2.lastIntValue = 0;
  return false;
};
function isOctalDigit(ch) {
  return ch >= 48 && ch <= 55;
}
pp$1.regexp_eatFixedHexDigits = function(state2, length) {
  var start = state2.pos;
  state2.lastIntValue = 0;
  for (var i = 0; i < length; ++i) {
    var ch = state2.current();
    if (!isHexDigit(ch)) {
      state2.pos = start;
      return false;
    }
    state2.lastIntValue = 16 * state2.lastIntValue + hexToInt(ch);
    state2.advance();
  }
  return true;
};
var Token = function Token2(p2) {
  this.type = p2.type;
  this.value = p2.value;
  this.start = p2.start;
  this.end = p2.end;
  if (p2.options.locations) {
    this.loc = new SourceLocation(p2, p2.startLoc, p2.endLoc);
  }
  if (p2.options.ranges) {
    this.range = [p2.start, p2.end];
  }
};
var pp = Parser.prototype;
pp.next = function(ignoreEscapeSequenceInKeyword) {
  if (!ignoreEscapeSequenceInKeyword && this.type.keyword && this.containsEsc) {
    this.raiseRecoverable(this.start, "Escape sequence in keyword " + this.type.keyword);
  }
  if (this.options.onToken) {
    this.options.onToken(new Token(this));
  }
  this.lastTokEnd = this.end;
  this.lastTokStart = this.start;
  this.lastTokEndLoc = this.endLoc;
  this.lastTokStartLoc = this.startLoc;
  this.nextToken();
};
pp.getToken = function() {
  this.next();
  return new Token(this);
};
if (typeof Symbol !== "undefined") {
  pp[Symbol.iterator] = function() {
    var this$1$1 = this;
    return {
      next: function() {
        var token = this$1$1.getToken();
        return {
          done: token.type === types$1.eof,
          value: token
        };
      }
    };
  };
}
pp.nextToken = function() {
  var curContext = this.curContext();
  if (!curContext || !curContext.preserveSpace) {
    this.skipSpace();
  }
  this.start = this.pos;
  if (this.options.locations) {
    this.startLoc = this.curPosition();
  }
  if (this.pos >= this.input.length) {
    return this.finishToken(types$1.eof);
  }
  if (curContext.override) {
    return curContext.override(this);
  } else {
    this.readToken(this.fullCharCodeAtPos());
  }
};
pp.readToken = function(code) {
  if (isIdentifierStart(code, this.options.ecmaVersion >= 6) || code === 92) {
    return this.readWord();
  }
  return this.getTokenFromCode(code);
};
pp.fullCharCodeAtPos = function() {
  var code = this.input.charCodeAt(this.pos);
  if (code <= 55295 || code >= 56320) {
    return code;
  }
  var next = this.input.charCodeAt(this.pos + 1);
  return next <= 56319 || next >= 57344 ? code : (code << 10) + next - 56613888;
};
pp.skipBlockComment = function() {
  var startLoc = this.options.onComment && this.curPosition();
  var start = this.pos, end = this.input.indexOf("*/", this.pos += 2);
  if (end === -1) {
    this.raise(this.pos - 2, "Unterminated comment");
  }
  this.pos = end + 2;
  if (this.options.locations) {
    for (var nextBreak = void 0, pos = start; (nextBreak = nextLineBreak(this.input, pos, this.pos)) > -1; ) {
      ++this.curLine;
      pos = this.lineStart = nextBreak;
    }
  }
  if (this.options.onComment) {
    this.options.onComment(
      true,
      this.input.slice(start + 2, end),
      start,
      this.pos,
      startLoc,
      this.curPosition()
    );
  }
};
pp.skipLineComment = function(startSkip) {
  var start = this.pos;
  var startLoc = this.options.onComment && this.curPosition();
  var ch = this.input.charCodeAt(this.pos += startSkip);
  while (this.pos < this.input.length && !isNewLine(ch)) {
    ch = this.input.charCodeAt(++this.pos);
  }
  if (this.options.onComment) {
    this.options.onComment(
      false,
      this.input.slice(start + startSkip, this.pos),
      start,
      this.pos,
      startLoc,
      this.curPosition()
    );
  }
};
pp.skipSpace = function() {
  loop: while (this.pos < this.input.length) {
    var ch = this.input.charCodeAt(this.pos);
    switch (ch) {
      case 32:
      case 160:
        ++this.pos;
        break;
      case 13:
        if (this.input.charCodeAt(this.pos + 1) === 10) {
          ++this.pos;
        }
      case 10:
      case 8232:
      case 8233:
        ++this.pos;
        if (this.options.locations) {
          ++this.curLine;
          this.lineStart = this.pos;
        }
        break;
      case 47:
        switch (this.input.charCodeAt(this.pos + 1)) {
          case 42:
            this.skipBlockComment();
            break;
          case 47:
            this.skipLineComment(2);
            break;
          default:
            break loop;
        }
        break;
      default:
        if (ch > 8 && ch < 14 || ch >= 5760 && nonASCIIwhitespace.test(String.fromCharCode(ch))) {
          ++this.pos;
        } else {
          break loop;
        }
    }
  }
};
pp.finishToken = function(type, val) {
  this.end = this.pos;
  if (this.options.locations) {
    this.endLoc = this.curPosition();
  }
  var prevType = this.type;
  this.type = type;
  this.value = val;
  this.updateContext(prevType);
};
pp.readToken_dot = function() {
  var next = this.input.charCodeAt(this.pos + 1);
  if (next >= 48 && next <= 57) {
    return this.readNumber(true);
  }
  var next2 = this.input.charCodeAt(this.pos + 2);
  if (this.options.ecmaVersion >= 6 && next === 46 && next2 === 46) {
    this.pos += 3;
    return this.finishToken(types$1.ellipsis);
  } else {
    ++this.pos;
    return this.finishToken(types$1.dot);
  }
};
pp.readToken_slash = function() {
  var next = this.input.charCodeAt(this.pos + 1);
  if (this.exprAllowed) {
    ++this.pos;
    return this.readRegexp();
  }
  if (next === 61) {
    return this.finishOp(types$1.assign, 2);
  }
  return this.finishOp(types$1.slash, 1);
};
pp.readToken_mult_modulo_exp = function(code) {
  var next = this.input.charCodeAt(this.pos + 1);
  var size = 1;
  var tokentype = code === 42 ? types$1.star : types$1.modulo;
  if (this.options.ecmaVersion >= 7 && code === 42 && next === 42) {
    ++size;
    tokentype = types$1.starstar;
    next = this.input.charCodeAt(this.pos + 2);
  }
  if (next === 61) {
    return this.finishOp(types$1.assign, size + 1);
  }
  return this.finishOp(tokentype, size);
};
pp.readToken_pipe_amp = function(code) {
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === code) {
    if (this.options.ecmaVersion >= 12) {
      var next2 = this.input.charCodeAt(this.pos + 2);
      if (next2 === 61) {
        return this.finishOp(types$1.assign, 3);
      }
    }
    return this.finishOp(code === 124 ? types$1.logicalOR : types$1.logicalAND, 2);
  }
  if (next === 61) {
    return this.finishOp(types$1.assign, 2);
  }
  return this.finishOp(code === 124 ? types$1.bitwiseOR : types$1.bitwiseAND, 1);
};
pp.readToken_caret = function() {
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === 61) {
    return this.finishOp(types$1.assign, 2);
  }
  return this.finishOp(types$1.bitwiseXOR, 1);
};
pp.readToken_plus_min = function(code) {
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === code) {
    if (next === 45 && !this.inModule && this.input.charCodeAt(this.pos + 2) === 62 && (this.lastTokEnd === 0 || lineBreak.test(this.input.slice(this.lastTokEnd, this.pos)))) {
      this.skipLineComment(3);
      this.skipSpace();
      return this.nextToken();
    }
    return this.finishOp(types$1.incDec, 2);
  }
  if (next === 61) {
    return this.finishOp(types$1.assign, 2);
  }
  return this.finishOp(types$1.plusMin, 1);
};
pp.readToken_lt_gt = function(code) {
  var next = this.input.charCodeAt(this.pos + 1);
  var size = 1;
  if (next === code) {
    size = code === 62 && this.input.charCodeAt(this.pos + 2) === 62 ? 3 : 2;
    if (this.input.charCodeAt(this.pos + size) === 61) {
      return this.finishOp(types$1.assign, size + 1);
    }
    return this.finishOp(types$1.bitShift, size);
  }
  if (next === 33 && code === 60 && !this.inModule && this.input.charCodeAt(this.pos + 2) === 45 && this.input.charCodeAt(this.pos + 3) === 45) {
    this.skipLineComment(4);
    this.skipSpace();
    return this.nextToken();
  }
  if (next === 61) {
    size = 2;
  }
  return this.finishOp(types$1.relational, size);
};
pp.readToken_eq_excl = function(code) {
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === 61) {
    return this.finishOp(types$1.equality, this.input.charCodeAt(this.pos + 2) === 61 ? 3 : 2);
  }
  if (code === 61 && next === 62 && this.options.ecmaVersion >= 6) {
    this.pos += 2;
    return this.finishToken(types$1.arrow);
  }
  return this.finishOp(code === 61 ? types$1.eq : types$1.prefix, 1);
};
pp.readToken_question = function() {
  var ecmaVersion = this.options.ecmaVersion;
  if (ecmaVersion >= 11) {
    var next = this.input.charCodeAt(this.pos + 1);
    if (next === 46) {
      var next2 = this.input.charCodeAt(this.pos + 2);
      if (next2 < 48 || next2 > 57) {
        return this.finishOp(types$1.questionDot, 2);
      }
    }
    if (next === 63) {
      if (ecmaVersion >= 12) {
        var next2$1 = this.input.charCodeAt(this.pos + 2);
        if (next2$1 === 61) {
          return this.finishOp(types$1.assign, 3);
        }
      }
      return this.finishOp(types$1.coalesce, 2);
    }
  }
  return this.finishOp(types$1.question, 1);
};
pp.readToken_numberSign = function() {
  var ecmaVersion = this.options.ecmaVersion;
  var code = 35;
  if (ecmaVersion >= 13) {
    ++this.pos;
    code = this.fullCharCodeAtPos();
    if (isIdentifierStart(code, true) || code === 92) {
      return this.finishToken(types$1.privateId, this.readWord1());
    }
  }
  this.raise(this.pos, "Unexpected character '" + codePointToString(code) + "'");
};
pp.getTokenFromCode = function(code) {
  switch (code) {
    case 46:
      return this.readToken_dot();
    case 40:
      ++this.pos;
      return this.finishToken(types$1.parenL);
    case 41:
      ++this.pos;
      return this.finishToken(types$1.parenR);
    case 59:
      ++this.pos;
      return this.finishToken(types$1.semi);
    case 44:
      ++this.pos;
      return this.finishToken(types$1.comma);
    case 91:
      ++this.pos;
      return this.finishToken(types$1.bracketL);
    case 93:
      ++this.pos;
      return this.finishToken(types$1.bracketR);
    case 123:
      ++this.pos;
      return this.finishToken(types$1.braceL);
    case 125:
      ++this.pos;
      return this.finishToken(types$1.braceR);
    case 58:
      ++this.pos;
      return this.finishToken(types$1.colon);
    case 96:
      if (this.options.ecmaVersion < 6) {
        break;
      }
      ++this.pos;
      return this.finishToken(types$1.backQuote);
    case 48:
      var next = this.input.charCodeAt(this.pos + 1);
      if (next === 120 || next === 88) {
        return this.readRadixNumber(16);
      }
      if (this.options.ecmaVersion >= 6) {
        if (next === 111 || next === 79) {
          return this.readRadixNumber(8);
        }
        if (next === 98 || next === 66) {
          return this.readRadixNumber(2);
        }
      }
    case 49:
    case 50:
    case 51:
    case 52:
    case 53:
    case 54:
    case 55:
    case 56:
    case 57:
      return this.readNumber(false);
    case 34:
    case 39:
      return this.readString(code);
    case 47:
      return this.readToken_slash();
    case 37:
    case 42:
      return this.readToken_mult_modulo_exp(code);
    case 124:
    case 38:
      return this.readToken_pipe_amp(code);
    case 94:
      return this.readToken_caret();
    case 43:
    case 45:
      return this.readToken_plus_min(code);
    case 60:
    case 62:
      return this.readToken_lt_gt(code);
    case 61:
    case 33:
      return this.readToken_eq_excl(code);
    case 63:
      return this.readToken_question();
    case 126:
      return this.finishOp(types$1.prefix, 1);
    case 35:
      return this.readToken_numberSign();
  }
  this.raise(this.pos, "Unexpected character '" + codePointToString(code) + "'");
};
pp.finishOp = function(type, size) {
  var str = this.input.slice(this.pos, this.pos + size);
  this.pos += size;
  return this.finishToken(type, str);
};
pp.readRegexp = function() {
  var escaped, inClass, start = this.pos;
  for (; ; ) {
    if (this.pos >= this.input.length) {
      this.raise(start, "Unterminated regular expression");
    }
    var ch = this.input.charAt(this.pos);
    if (lineBreak.test(ch)) {
      this.raise(start, "Unterminated regular expression");
    }
    if (!escaped) {
      if (ch === "[") {
        inClass = true;
      } else if (ch === "]" && inClass) {
        inClass = false;
      } else if (ch === "/" && !inClass) {
        break;
      }
      escaped = ch === "\\";
    } else {
      escaped = false;
    }
    ++this.pos;
  }
  var pattern = this.input.slice(start, this.pos);
  ++this.pos;
  var flagsStart = this.pos;
  var flags = this.readWord1();
  if (this.containsEsc) {
    this.unexpected(flagsStart);
  }
  var state2 = this.regexpState || (this.regexpState = new RegExpValidationState(this));
  state2.reset(start, pattern, flags);
  this.validateRegExpFlags(state2);
  this.validateRegExpPattern(state2);
  var value = null;
  try {
    value = new RegExp(pattern, flags);
  } catch (e2) {
  }
  return this.finishToken(types$1.regexp, { pattern, flags, value });
};
pp.readInt = function(radix, len, maybeLegacyOctalNumericLiteral) {
  var allowSeparators = this.options.ecmaVersion >= 12 && len === void 0;
  var isLegacyOctalNumericLiteral = maybeLegacyOctalNumericLiteral && this.input.charCodeAt(this.pos) === 48;
  var start = this.pos, total = 0, lastCode = 0;
  for (var i = 0, e2 = len == null ? Infinity : len; i < e2; ++i, ++this.pos) {
    var code = this.input.charCodeAt(this.pos), val = void 0;
    if (allowSeparators && code === 95) {
      if (isLegacyOctalNumericLiteral) {
        this.raiseRecoverable(this.pos, "Numeric separator is not allowed in legacy octal numeric literals");
      }
      if (lastCode === 95) {
        this.raiseRecoverable(this.pos, "Numeric separator must be exactly one underscore");
      }
      if (i === 0) {
        this.raiseRecoverable(this.pos, "Numeric separator is not allowed at the first of digits");
      }
      lastCode = code;
      continue;
    }
    if (code >= 97) {
      val = code - 97 + 10;
    } else if (code >= 65) {
      val = code - 65 + 10;
    } else if (code >= 48 && code <= 57) {
      val = code - 48;
    } else {
      val = Infinity;
    }
    if (val >= radix) {
      break;
    }
    lastCode = code;
    total = total * radix + val;
  }
  if (allowSeparators && lastCode === 95) {
    this.raiseRecoverable(this.pos - 1, "Numeric separator is not allowed at the last of digits");
  }
  if (this.pos === start || len != null && this.pos - start !== len) {
    return null;
  }
  return total;
};
function stringToNumber(str, isLegacyOctalNumericLiteral) {
  if (isLegacyOctalNumericLiteral) {
    return parseInt(str, 8);
  }
  return parseFloat(str.replace(/_/g, ""));
}
function stringToBigInt(str) {
  if (typeof BigInt !== "function") {
    return null;
  }
  return BigInt(str.replace(/_/g, ""));
}
pp.readRadixNumber = function(radix) {
  var start = this.pos;
  this.pos += 2;
  var val = this.readInt(radix);
  if (val == null) {
    this.raise(this.start + 2, "Expected number in radix " + radix);
  }
  if (this.options.ecmaVersion >= 11 && this.input.charCodeAt(this.pos) === 110) {
    val = stringToBigInt(this.input.slice(start, this.pos));
    ++this.pos;
  } else if (isIdentifierStart(this.fullCharCodeAtPos())) {
    this.raise(this.pos, "Identifier directly after number");
  }
  return this.finishToken(types$1.num, val);
};
pp.readNumber = function(startsWithDot) {
  var start = this.pos;
  if (!startsWithDot && this.readInt(10, void 0, true) === null) {
    this.raise(start, "Invalid number");
  }
  var octal = this.pos - start >= 2 && this.input.charCodeAt(start) === 48;
  if (octal && this.strict) {
    this.raise(start, "Invalid number");
  }
  var next = this.input.charCodeAt(this.pos);
  if (!octal && !startsWithDot && this.options.ecmaVersion >= 11 && next === 110) {
    var val$1 = stringToBigInt(this.input.slice(start, this.pos));
    ++this.pos;
    if (isIdentifierStart(this.fullCharCodeAtPos())) {
      this.raise(this.pos, "Identifier directly after number");
    }
    return this.finishToken(types$1.num, val$1);
  }
  if (octal && /[89]/.test(this.input.slice(start, this.pos))) {
    octal = false;
  }
  if (next === 46 && !octal) {
    ++this.pos;
    this.readInt(10);
    next = this.input.charCodeAt(this.pos);
  }
  if ((next === 69 || next === 101) && !octal) {
    next = this.input.charCodeAt(++this.pos);
    if (next === 43 || next === 45) {
      ++this.pos;
    }
    if (this.readInt(10) === null) {
      this.raise(start, "Invalid number");
    }
  }
  if (isIdentifierStart(this.fullCharCodeAtPos())) {
    this.raise(this.pos, "Identifier directly after number");
  }
  var val = stringToNumber(this.input.slice(start, this.pos), octal);
  return this.finishToken(types$1.num, val);
};
pp.readCodePoint = function() {
  var ch = this.input.charCodeAt(this.pos), code;
  if (ch === 123) {
    if (this.options.ecmaVersion < 6) {
      this.unexpected();
    }
    var codePos = ++this.pos;
    code = this.readHexChar(this.input.indexOf("}", this.pos) - this.pos);
    ++this.pos;
    if (code > 1114111) {
      this.invalidStringToken(codePos, "Code point out of bounds");
    }
  } else {
    code = this.readHexChar(4);
  }
  return code;
};
pp.readString = function(quote) {
  var out = "", chunkStart = ++this.pos;
  for (; ; ) {
    if (this.pos >= this.input.length) {
      this.raise(this.start, "Unterminated string constant");
    }
    var ch = this.input.charCodeAt(this.pos);
    if (ch === quote) {
      break;
    }
    if (ch === 92) {
      out += this.input.slice(chunkStart, this.pos);
      out += this.readEscapedChar(false);
      chunkStart = this.pos;
    } else if (ch === 8232 || ch === 8233) {
      if (this.options.ecmaVersion < 10) {
        this.raise(this.start, "Unterminated string constant");
      }
      ++this.pos;
      if (this.options.locations) {
        this.curLine++;
        this.lineStart = this.pos;
      }
    } else {
      if (isNewLine(ch)) {
        this.raise(this.start, "Unterminated string constant");
      }
      ++this.pos;
    }
  }
  out += this.input.slice(chunkStart, this.pos++);
  return this.finishToken(types$1.string, out);
};
var INVALID_TEMPLATE_ESCAPE_ERROR = {};
pp.tryReadTemplateToken = function() {
  this.inTemplateElement = true;
  try {
    this.readTmplToken();
  } catch (err) {
    if (err === INVALID_TEMPLATE_ESCAPE_ERROR) {
      this.readInvalidTemplateToken();
    } else {
      throw err;
    }
  }
  this.inTemplateElement = false;
};
pp.invalidStringToken = function(position, message) {
  if (this.inTemplateElement && this.options.ecmaVersion >= 9) {
    throw INVALID_TEMPLATE_ESCAPE_ERROR;
  } else {
    this.raise(position, message);
  }
};
pp.readTmplToken = function() {
  var out = "", chunkStart = this.pos;
  for (; ; ) {
    if (this.pos >= this.input.length) {
      this.raise(this.start, "Unterminated template");
    }
    var ch = this.input.charCodeAt(this.pos);
    if (ch === 96 || ch === 36 && this.input.charCodeAt(this.pos + 1) === 123) {
      if (this.pos === this.start && (this.type === types$1.template || this.type === types$1.invalidTemplate)) {
        if (ch === 36) {
          this.pos += 2;
          return this.finishToken(types$1.dollarBraceL);
        } else {
          ++this.pos;
          return this.finishToken(types$1.backQuote);
        }
      }
      out += this.input.slice(chunkStart, this.pos);
      return this.finishToken(types$1.template, out);
    }
    if (ch === 92) {
      out += this.input.slice(chunkStart, this.pos);
      out += this.readEscapedChar(true);
      chunkStart = this.pos;
    } else if (isNewLine(ch)) {
      out += this.input.slice(chunkStart, this.pos);
      ++this.pos;
      switch (ch) {
        case 13:
          if (this.input.charCodeAt(this.pos) === 10) {
            ++this.pos;
          }
        case 10:
          out += "\n";
          break;
        default:
          out += String.fromCharCode(ch);
          break;
      }
      if (this.options.locations) {
        ++this.curLine;
        this.lineStart = this.pos;
      }
      chunkStart = this.pos;
    } else {
      ++this.pos;
    }
  }
};
pp.readInvalidTemplateToken = function() {
  for (; this.pos < this.input.length; this.pos++) {
    switch (this.input[this.pos]) {
      case "\\":
        ++this.pos;
        break;
      case "$":
        if (this.input[this.pos + 1] !== "{") {
          break;
        }
      case "`":
        return this.finishToken(types$1.invalidTemplate, this.input.slice(this.start, this.pos));
      case "\r":
        if (this.input[this.pos + 1] === "\n") {
          ++this.pos;
        }
      case "\n":
      case "\u2028":
      case "\u2029":
        ++this.curLine;
        this.lineStart = this.pos + 1;
        break;
    }
  }
  this.raise(this.start, "Unterminated template");
};
pp.readEscapedChar = function(inTemplate) {
  var ch = this.input.charCodeAt(++this.pos);
  ++this.pos;
  switch (ch) {
    case 110:
      return "\n";
    case 114:
      return "\r";
    case 120:
      return String.fromCharCode(this.readHexChar(2));
    case 117:
      return codePointToString(this.readCodePoint());
    case 116:
      return "	";
    case 98:
      return "\b";
    case 118:
      return "\v";
    case 102:
      return "\f";
    case 13:
      if (this.input.charCodeAt(this.pos) === 10) {
        ++this.pos;
      }
    case 10:
      if (this.options.locations) {
        this.lineStart = this.pos;
        ++this.curLine;
      }
      return "";
    case 56:
    case 57:
      if (this.strict) {
        this.invalidStringToken(
          this.pos - 1,
          "Invalid escape sequence"
        );
      }
      if (inTemplate) {
        var codePos = this.pos - 1;
        this.invalidStringToken(
          codePos,
          "Invalid escape sequence in template string"
        );
      }
    default:
      if (ch >= 48 && ch <= 55) {
        var octalStr = this.input.substr(this.pos - 1, 3).match(/^[0-7]+/)[0];
        var octal = parseInt(octalStr, 8);
        if (octal > 255) {
          octalStr = octalStr.slice(0, -1);
          octal = parseInt(octalStr, 8);
        }
        this.pos += octalStr.length - 1;
        ch = this.input.charCodeAt(this.pos);
        if ((octalStr !== "0" || ch === 56 || ch === 57) && (this.strict || inTemplate)) {
          this.invalidStringToken(
            this.pos - 1 - octalStr.length,
            inTemplate ? "Octal literal in template string" : "Octal literal in strict mode"
          );
        }
        return String.fromCharCode(octal);
      }
      if (isNewLine(ch)) {
        if (this.options.locations) {
          this.lineStart = this.pos;
          ++this.curLine;
        }
        return "";
      }
      return String.fromCharCode(ch);
  }
};
pp.readHexChar = function(len) {
  var codePos = this.pos;
  var n2 = this.readInt(16, len);
  if (n2 === null) {
    this.invalidStringToken(codePos, "Bad character escape sequence");
  }
  return n2;
};
pp.readWord1 = function() {
  this.containsEsc = false;
  var word = "", first = true, chunkStart = this.pos;
  var astral = this.options.ecmaVersion >= 6;
  while (this.pos < this.input.length) {
    var ch = this.fullCharCodeAtPos();
    if (isIdentifierChar(ch, astral)) {
      this.pos += ch <= 65535 ? 1 : 2;
    } else if (ch === 92) {
      this.containsEsc = true;
      word += this.input.slice(chunkStart, this.pos);
      var escStart = this.pos;
      if (this.input.charCodeAt(++this.pos) !== 117) {
        this.invalidStringToken(this.pos, "Expecting Unicode escape sequence \\uXXXX");
      }
      ++this.pos;
      var esc = this.readCodePoint();
      if (!(first ? isIdentifierStart : isIdentifierChar)(esc, astral)) {
        this.invalidStringToken(escStart, "Invalid Unicode escape");
      }
      word += codePointToString(esc);
      chunkStart = this.pos;
    } else {
      break;
    }
    first = false;
  }
  return word + this.input.slice(chunkStart, this.pos);
};
pp.readWord = function() {
  var word = this.readWord1();
  var type = types$1.name;
  if (this.keywords.test(word)) {
    type = keywords[word];
  }
  return this.finishToken(type, word);
};
var version = "8.13.0";
Parser.acorn = {
  Parser,
  version,
  defaultOptions,
  Position,
  SourceLocation,
  getLineInfo,
  Node: Node$1,
  TokenType,
  tokTypes: types$1,
  keywordTypes: keywords,
  TokContext,
  tokContexts: types,
  isIdentifierChar,
  isIdentifierStart,
  Token,
  isNewLine,
  lineBreak,
  lineBreakG,
  nonASCIIwhitespace
};
function parse3(input, options) {
  return Parser.parse(input, options);
}
function parseExpressionAt2(input, pos, options) {
  return Parser.parseExpressionAt(input, pos, options);
}
function tokenizer2(input, options) {
  return Parser.tokenizer(input, options);
}
const t = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Node: Node$1,
  Parser,
  Position,
  SourceLocation,
  TokContext,
  Token,
  TokenType,
  defaultOptions,
  getLineInfo,
  isIdentifierChar,
  isIdentifierStart,
  isNewLine,
  keywordTypes: keywords,
  lineBreak,
  lineBreakG,
  nonASCIIwhitespace,
  parse: parse3,
  parseExpressionAt: parseExpressionAt2,
  tokContexts: types,
  tokTypes: types$1,
  tokenizer: tokenizer2,
  version
}, Symbol.toStringTag, { value: "Module" }));
function a(t2, e2) {
  for (var s = 0; s < e2.length; s++) {
    var i = e2[s];
    i.enumerable = i.enumerable || false, i.configurable = true, "value" in i && (i.writable = true), Object.defineProperty(t2, "symbol" == typeof (r = function(t3, e3) {
      if ("object" != typeof t3 || null === t3) return t3;
      var s2 = t3[Symbol.toPrimitive];
      if (void 0 !== s2) {
        var i2 = s2.call(t3, "string");
        if ("object" != typeof i2) return i2;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return String(t3);
    }(i.key)) ? r : String(r), i);
  }
  var r;
}
function n() {
  return n = Object.assign ? Object.assign.bind() : function(t2) {
    for (var e2 = 1; e2 < arguments.length; e2++) {
      var s = arguments[e2];
      for (var i in s) Object.prototype.hasOwnProperty.call(s, i) && (t2[i] = s[i]);
    }
    return t2;
  }, n.apply(this, arguments);
}
function o(t2, e2) {
  t2.prototype = Object.create(e2.prototype), t2.prototype.constructor = t2, h(t2, e2);
}
function h(t2, e2) {
  return h = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(t3, e3) {
    return t3.__proto__ = e3, t3;
  }, h(t2, e2);
}
function p(t2, e2) {
  (null == e2 || e2 > t2.length) && (e2 = t2.length);
  for (var s = 0, i = new Array(e2); s < e2; s++) i[s] = t2[s];
  return i;
}
function c(t2, e2) {
  var s = "undefined" != typeof Symbol && t2[Symbol.iterator] || t2["@@iterator"];
  if (s) return (s = s.call(t2)).next.bind(s);
  if (Array.isArray(t2) || (s = function(t3, e3) {
    if (t3) {
      if ("string" == typeof t3) return p(t3, e3);
      var s2 = Object.prototype.toString.call(t3).slice(8, -1);
      return "Object" === s2 && t3.constructor && (s2 = t3.constructor.name), "Map" === s2 || "Set" === s2 ? Array.from(t3) : "Arguments" === s2 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(s2) ? p(t3, e3) : void 0;
    }
  }(t2)) || e2) {
    s && (t2 = s);
    var i = 0;
    return function() {
      return i >= t2.length ? { done: true } : { done: false, value: t2[i++] };
    };
  }
  throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
var l = true;
function u(t2, e2) {
  return void 0 === e2 && (e2 = {}), new TokenType("name", e2);
}
var d = /* @__PURE__ */ new WeakMap();
function m(t2) {
  var a2 = d.get(t2.Parser.acorn || t2);
  if (!a2) {
    var o2 = { assert: u(0, { startsExpr: l }), asserts: u(0, { startsExpr: l }), global: u(0, { startsExpr: l }), keyof: u(0, { startsExpr: l }), readonly: u(0, { startsExpr: l }), unique: u(0, { startsExpr: l }), abstract: u(0, { startsExpr: l }), declare: u(0, { startsExpr: l }), enum: u(0, { startsExpr: l }), module: u(0, { startsExpr: l }), namespace: u(0, { startsExpr: l }), interface: u(0, { startsExpr: l }), type: u(0, { startsExpr: l }) }, h2 = { at: new TokenType("@"), jsxName: new TokenType("jsxName"), jsxText: new TokenType("jsxText", { beforeExpr: true }), jsxTagStart: new TokenType("jsxTagStart", { startsExpr: true }), jsxTagEnd: new TokenType("jsxTagEnd") }, p2 = { tc_oTag: new TokContext("<tag", false, false), tc_cTag: new TokContext("</tag", false, false), tc_expr: new TokContext("<tag>...</tag>", true, true) }, c2 = new RegExp("^(?:" + Object.keys(o2).join("|") + ")$");
    h2.jsxTagStart.updateContext = function() {
      this.context.push(p2.tc_expr), this.context.push(p2.tc_oTag), this.exprAllowed = false;
    }, h2.jsxTagEnd.updateContext = function(t3) {
      var s = this.context.pop();
      s === p2.tc_oTag && t3 === types$1.slash || s === p2.tc_cTag ? (this.context.pop(), this.exprAllowed = this.curContext() === p2.tc_expr) : this.exprAllowed = true;
    }, a2 = { tokTypes: n({}, o2, h2), tokContexts: n({}, p2), keywordsRegExp: c2, tokenIsLiteralPropertyName: function(t3) {
      return [types$1.name, types$1.string, types$1.num].concat(Object.values(keywords), Object.values(o2)).includes(t3);
    }, tokenIsKeywordOrIdentifier: function(t3) {
      return [types$1.name].concat(Object.values(keywords), Object.values(o2)).includes(t3);
    }, tokenIsIdentifier: function(t3) {
      return [].concat(Object.values(o2), [types$1.name]).includes(t3);
    }, tokenIsTSDeclarationStart: function(t3) {
      return [o2.abstract, o2.declare, o2.enum, o2.module, o2.namespace, o2.interface, o2.type].includes(t3);
    }, tokenIsTSTypeOperator: function(t3) {
      return [o2.keyof, o2.readonly, o2.unique].includes(t3);
    }, tokenIsTemplate: function(t3) {
      return t3 === types$1.invalidTemplate;
    } };
  }
  return a2;
}
var f = 1024, y = new RegExp("(?:[^\\S\\n\\r\\u2028\\u2029]|\\/\\/.*|\\/\\*.*?\\*\\/)*", "y"), x = new RegExp("(?=(" + y.source + "))\\1" + /(?=[\n\r\u2028\u2029]|\/\*(?!.*?\*\/)|$)/.source, "y"), T = function() {
  this.shorthandAssign = void 0, this.trailingComma = void 0, this.parenthesizedAssign = void 0, this.parenthesizedBind = void 0, this.doubleProto = void 0, this.shorthandAssign = this.trailingComma = this.parenthesizedAssign = this.parenthesizedBind = this.doubleProto = -1;
};
function v(t2, e2) {
  var s = e2.key.name, i = t2[s], r = "true";
  return "MethodDefinition" !== e2.type || "get" !== e2.kind && "set" !== e2.kind || (r = (e2.static ? "s" : "i") + e2.kind), "iget" === i && "iset" === r || "iset" === i && "iget" === r || "sget" === i && "sset" === r || "sset" === i && "sget" === r ? (t2[s] = "true", false) : !!i || (t2[s] = r, false);
}
function P(t2, e2) {
  var s = t2.key;
  return !t2.computed && ("Identifier" === s.type && s.name === e2 || "Literal" === s.type && s.value === e2);
}
var b = { AbstractMethodHasImplementation: function(t2) {
  return "Method '" + t2.methodName + "' cannot have an implementation because it is marked abstract.";
}, AbstractPropertyHasInitializer: function(t2) {
  return "Property '" + t2.propertyName + "' cannot have an initializer because it is marked abstract.";
}, AccesorCannotDeclareThisParameter: "'get' and 'set' accessors cannot declare 'this' parameters.", AccesorCannotHaveTypeParameters: "An accessor cannot have type parameters.", CannotFindName: function(t2) {
  return "Cannot find name '" + t2.name + "'.";
}, ClassMethodHasDeclare: "Class methods cannot have the 'declare' modifier.", ClassMethodHasReadonly: "Class methods cannot have the 'readonly' modifier.", ConstInitiailizerMustBeStringOrNumericLiteralOrLiteralEnumReference: "A 'const' initializer in an ambient context must be a string or numeric literal or literal enum reference.", ConstructorHasTypeParameters: "Type parameters cannot appear on a constructor declaration.", DeclareAccessor: function(t2) {
  return "'declare' is not allowed in " + t2.kind + "ters.";
}, DeclareClassFieldHasInitializer: "Initializers are not allowed in ambient contexts.", DeclareFunctionHasImplementation: "An implementation cannot be declared in ambient contexts.", DuplicateAccessibilityModifier: function() {
  return "Accessibility modifier already seen.";
}, DuplicateModifier: function(t2) {
  return "Duplicate modifier: '" + t2.modifier + "'.";
}, EmptyHeritageClauseType: function(t2) {
  return "'" + t2.token + "' list cannot be empty.";
}, EmptyTypeArguments: "Type argument list cannot be empty.", EmptyTypeParameters: "Type parameter list cannot be empty.", ExpectedAmbientAfterExportDeclare: "'export declare' must be followed by an ambient declaration.", ImportAliasHasImportType: "An import alias can not use 'import type'.", IncompatibleModifiers: function(t2) {
  var e2 = t2.modifiers;
  return "'" + e2[0] + "' modifier cannot be used with '" + e2[1] + "' modifier.";
}, IndexSignatureHasAbstract: "Index signatures cannot have the 'abstract' modifier.", IndexSignatureHasAccessibility: function(t2) {
  return "Index signatures cannot have an accessibility modifier ('" + t2.modifier + "').";
}, IndexSignatureHasDeclare: "Index signatures cannot have the 'declare' modifier.", IndexSignatureHasOverride: "'override' modifier cannot appear on an index signature.", IndexSignatureHasStatic: "Index signatures cannot have the 'static' modifier.", InitializerNotAllowedInAmbientContext: "Initializers are not allowed in ambient contexts.", InvalidModifierOnTypeMember: function(t2) {
  return "'" + t2.modifier + "' modifier cannot appear on a type member.";
}, InvalidModifierOnTypeParameter: function(t2) {
  return "'" + t2.modifier + "' modifier cannot appear on a type parameter.";
}, InvalidModifierOnTypeParameterPositions: function(t2) {
  return "'" + t2.modifier + "' modifier can only appear on a type parameter of a class, interface or type alias.";
}, InvalidModifiersOrder: function(t2) {
  var e2 = t2.orderedModifiers;
  return "'" + e2[0] + "' modifier must precede '" + e2[1] + "' modifier.";
}, InvalidPropertyAccessAfterInstantiationExpression: "Invalid property access after an instantiation expression. You can either wrap the instantiation expression in parentheses, or delete the type arguments.", InvalidTupleMemberLabel: "Tuple members must be labeled with a simple identifier.", MissingInterfaceName: "'interface' declarations must be followed by an identifier.", MixedLabeledAndUnlabeledElements: "Tuple members must all have names or all not have names.", NonAbstractClassHasAbstractMethod: "Abstract methods can only appear within an abstract class.", NonClassMethodPropertyHasAbstractModifer: "'abstract' modifier can only appear on a class, method, or property declaration.", OptionalTypeBeforeRequired: "A required element cannot follow an optional element.", OverrideNotInSubClass: "This member cannot have an 'override' modifier because its containing class does not extend another class.", PatternIsOptional: "A binding pattern parameter cannot be optional in an implementation signature.", PrivateElementHasAbstract: "Private elements cannot have the 'abstract' modifier.", PrivateElementHasAccessibility: function(t2) {
  return "Private elements cannot have an accessibility modifier ('" + t2.modifier + "').";
}, PrivateMethodsHasAccessibility: function(t2) {
  return "Private methods cannot have an accessibility modifier ('" + t2.modifier + "').";
}, ReadonlyForMethodSignature: "'readonly' modifier can only appear on a property declaration or index signature.", ReservedArrowTypeParam: "This syntax is reserved in files with the .mts or .cts extension. Add a trailing comma, as in `<T,>() => ...`.", ReservedTypeAssertion: "This syntax is reserved in files with the .mts or .cts extension. Use an `as` expression instead.", SetAccesorCannotHaveOptionalParameter: "A 'set' accessor cannot have an optional parameter.", SetAccesorCannotHaveRestParameter: "A 'set' accessor cannot have rest parameter.", SetAccesorCannotHaveReturnType: "A 'set' accessor cannot have a return type annotation.", SingleTypeParameterWithoutTrailingComma: function(t2) {
  var e2 = t2.typeParameterName;
  return "Single type parameter " + e2 + " should have a trailing comma. Example usage: <" + e2 + ",>.";
}, StaticBlockCannotHaveModifier: "Static class blocks cannot have any modifier.", TypeAnnotationAfterAssign: "Type annotations must come before default assignments, e.g. instead of `age = 25: number` use `age: number = 25`.", TypeImportCannotSpecifyDefaultAndNamed: "A type-only import can specify a default import or named bindings, but not both.", TypeModifierIsUsedInTypeExports: "The 'type' modifier cannot be used on a named export when 'export type' is used on its export statement.", TypeModifierIsUsedInTypeImports: "The 'type' modifier cannot be used on a named import when 'import type' is used on its import statement.", UnexpectedParameterModifier: "A parameter property is only allowed in a constructor implementation.", UnexpectedReadonly: "'readonly' type modifier is only permitted on array and tuple literal types.", GenericsEndWithComma: "Trailing comma is not allowed at the end of generics.", UnexpectedTypeAnnotation: "Did not expect a type annotation here.", UnexpectedTypeCastInParameter: "Unexpected type cast in parameter position.", UnsupportedImportTypeArgument: "Argument in a type import must be a string literal.", UnsupportedParameterPropertyKind: "A parameter property may not be declared using a binding pattern.", UnsupportedSignatureParameterKind: function(t2) {
  return "Name in a signature must be an Identifier, ObjectPattern or ArrayPattern, instead got " + t2.type + ".";
}, LetInLexicalBinding: "'let' is not allowed to be used as a name in 'let' or 'const' declarations." }, g = { quot: '"', amp: "&", apos: "'", lt: "<", gt: ">", nbsp: " ", iexcl: "¡", cent: "¢", pound: "£", curren: "¤", yen: "¥", brvbar: "¦", sect: "§", uml: "¨", copy: "©", ordf: "ª", laquo: "«", not: "¬", shy: "­", reg: "®", macr: "¯", deg: "°", plusmn: "±", sup2: "²", sup3: "³", acute: "´", micro: "µ", para: "¶", middot: "·", cedil: "¸", sup1: "¹", ordm: "º", raquo: "»", frac14: "¼", frac12: "½", frac34: "¾", iquest: "¿", Agrave: "À", Aacute: "Á", Acirc: "Â", Atilde: "Ã", Auml: "Ä", Aring: "Å", AElig: "Æ", Ccedil: "Ç", Egrave: "È", Eacute: "É", Ecirc: "Ê", Euml: "Ë", Igrave: "Ì", Iacute: "Í", Icirc: "Î", Iuml: "Ï", ETH: "Ð", Ntilde: "Ñ", Ograve: "Ò", Oacute: "Ó", Ocirc: "Ô", Otilde: "Õ", Ouml: "Ö", times: "×", Oslash: "Ø", Ugrave: "Ù", Uacute: "Ú", Ucirc: "Û", Uuml: "Ü", Yacute: "Ý", THORN: "Þ", szlig: "ß", agrave: "à", aacute: "á", acirc: "â", atilde: "ã", auml: "ä", aring: "å", aelig: "æ", ccedil: "ç", egrave: "è", eacute: "é", ecirc: "ê", euml: "ë", igrave: "ì", iacute: "í", icirc: "î", iuml: "ï", eth: "ð", ntilde: "ñ", ograve: "ò", oacute: "ó", ocirc: "ô", otilde: "õ", ouml: "ö", divide: "÷", oslash: "ø", ugrave: "ù", uacute: "ú", ucirc: "û", uuml: "ü", yacute: "ý", thorn: "þ", yuml: "ÿ", OElig: "Œ", oelig: "œ", Scaron: "Š", scaron: "š", Yuml: "Ÿ", fnof: "ƒ", circ: "ˆ", tilde: "˜", Alpha: "Α", Beta: "Β", Gamma: "Γ", Delta: "Δ", Epsilon: "Ε", Zeta: "Ζ", Eta: "Η", Theta: "Θ", Iota: "Ι", Kappa: "Κ", Lambda: "Λ", Mu: "Μ", Nu: "Ν", Xi: "Ξ", Omicron: "Ο", Pi: "Π", Rho: "Ρ", Sigma: "Σ", Tau: "Τ", Upsilon: "Υ", Phi: "Φ", Chi: "Χ", Psi: "Ψ", Omega: "Ω", alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", zeta: "ζ", eta: "η", theta: "θ", iota: "ι", kappa: "κ", lambda: "λ", mu: "μ", nu: "ν", xi: "ξ", omicron: "ο", pi: "π", rho: "ρ", sigmaf: "ς", sigma: "σ", tau: "τ", upsilon: "υ", phi: "φ", chi: "χ", psi: "ψ", omega: "ω", thetasym: "ϑ", upsih: "ϒ", piv: "ϖ", ensp: " ", emsp: " ", thinsp: " ", zwnj: "‌", zwj: "‍", lrm: "‎", rlm: "‏", ndash: "–", mdash: "—", lsquo: "‘", rsquo: "’", sbquo: "‚", ldquo: "“", rdquo: "”", bdquo: "„", dagger: "†", Dagger: "‡", bull: "•", hellip: "…", permil: "‰", prime: "′", Prime: "″", lsaquo: "‹", rsaquo: "›", oline: "‾", frasl: "⁄", euro: "€", image: "ℑ", weierp: "℘", real: "ℜ", trade: "™", alefsym: "ℵ", larr: "←", uarr: "↑", rarr: "→", darr: "↓", harr: "↔", crarr: "↵", lArr: "⇐", uArr: "⇑", rArr: "⇒", dArr: "⇓", hArr: "⇔", forall: "∀", part: "∂", exist: "∃", empty: "∅", nabla: "∇", isin: "∈", notin: "∉", ni: "∋", prod: "∏", sum: "∑", minus: "−", lowast: "∗", radic: "√", prop: "∝", infin: "∞", ang: "∠", and: "∧", or: "∨", cap: "∩", cup: "∪", int: "∫", there4: "∴", sim: "∼", cong: "≅", asymp: "≈", ne: "≠", equiv: "≡", le: "≤", ge: "≥", sub: "⊂", sup: "⊃", nsub: "⊄", sube: "⊆", supe: "⊇", oplus: "⊕", otimes: "⊗", perp: "⊥", sdot: "⋅", lceil: "⌈", rceil: "⌉", lfloor: "⌊", rfloor: "⌋", lang: "〈", rang: "〉", loz: "◊", spades: "♠", clubs: "♣", hearts: "♥", diams: "♦" }, A = /^[\da-fA-F]+$/, S = /^\d+$/;
function C(t2) {
  return t2 ? "JSXIdentifier" === t2.type ? t2.name : "JSXNamespacedName" === t2.type ? t2.namespace.name + ":" + t2.name.name : "JSXMemberExpression" === t2.type ? C(t2.object) + "." + C(t2.property) : void 0 : t2;
}
var E = /(?:\s|\/\/.*|\/\*[^]*?\*\/)*/g;
function k$2(t2) {
  if (!t2) throw new Error("Assert fail");
}
function I(t2) {
  return "accessor" === t2;
}
function N(t2) {
  return "in" === t2 || "out" === t2;
}
function w(t2, e2) {
  return 2 | (t2 ? 4 : 0) | (e2 ? 8 : 0);
}
function L(t2) {
  if ("MemberExpression" !== t2.type) return false;
  var e2 = t2.property;
  return (!t2.computed || !("TemplateLiteral" !== e2.type || e2.expressions.length > 0)) && M(t2.object);
}
function M(t2) {
  return "Identifier" === t2.type || "MemberExpression" === t2.type && !t2.computed && M(t2.object);
}
function O(t2) {
  return "private" === t2 || "public" === t2 || "protected" === t2;
}
function D(e2) {
  var s = e2 || {}, i = s.dts, r = void 0 !== i && i, n2 = s.allowSatisfies, h2 = void 0 !== n2 && n2;
  return function(s2) {
    var i2 = s2.acorn || t, n3 = m(i2), p2 = i2.tokTypes, l2 = i2.keywordTypes, u2 = i2.isIdentifierStart, d2 = i2.lineBreak, y2 = i2.isNewLine, M2 = i2.tokContexts, D2 = i2.isIdentifierChar, _ = n3.tokTypes, R = n3.tokContexts, j = n3.keywordsRegExp, F = n3.tokenIsLiteralPropertyName, B = n3.tokenIsTemplate, H = n3.tokenIsTSDeclarationStart, q = n3.tokenIsIdentifier, U = n3.tokenIsKeywordOrIdentifier, V = n3.tokenIsTSTypeOperator;
    function K(t2, e3, s3) {
      void 0 === s3 && (s3 = t2.length);
      for (var i3 = e3; i3 < s3; i3++) {
        var r2 = t2.charCodeAt(i3);
        if (y2(r2)) return i3 < s3 - 1 && 13 === r2 && 10 === t2.charCodeAt(i3 + 1) ? i3 + 2 : i3 + 1;
      }
      return -1;
    }
    s2 = function(t2, e3, s3) {
      var i3 = s3.tokTypes, r2 = e3.tokTypes;
      return function(t3) {
        function e4() {
          return t3.apply(this, arguments) || this;
        }
        o(e4, t3);
        var s4 = e4.prototype;
        return s4.takeDecorators = function(t4) {
          var e5 = this.decoratorStack[this.decoratorStack.length - 1];
          e5.length && (t4.decorators = e5, this.resetStartLocationFromNode(t4, e5[0]), this.decoratorStack[this.decoratorStack.length - 1] = []);
        }, s4.parseDecorators = function(t4) {
          for (var e5 = this.decoratorStack[this.decoratorStack.length - 1]; this.match(r2.at); ) {
            var s5 = this.parseDecorator();
            e5.push(s5);
          }
          this.match(i3._export) ? t4 || this.unexpected() : this.canHaveLeadingDecorator() || this.raise(this.start, "Leading decorators must be attached to a class declaration.");
        }, s4.parseDecorator = function() {
          var t4 = this.startNode();
          this.next(), this.decoratorStack.push([]);
          var e5, s5 = this.start, r3 = this.startLoc;
          if (this.match(i3.parenL)) {
            var a2 = this.start, n4 = this.startLoc;
            if (this.next(), e5 = this.parseExpression(), this.expect(i3.parenR), this.options.preserveParens) {
              var o2 = this.startNodeAt(a2, n4);
              o2.expression = e5, e5 = this.finishNode(o2, "ParenthesizedExpression");
            }
          } else for (e5 = this.parseIdent(false); this.eat(i3.dot); ) {
            var h3 = this.startNodeAt(s5, r3);
            h3.object = e5, h3.property = this.parseIdent(true), h3.computed = false, e5 = this.finishNode(h3, "MemberExpression");
          }
          return t4.expression = this.parseMaybeDecoratorArguments(e5), this.decoratorStack.pop(), this.finishNode(t4, "Decorator");
        }, s4.parseMaybeDecoratorArguments = function(t4) {
          if (this.eat(i3.parenL)) {
            var e5 = this.startNodeAtNode(t4);
            return e5.callee = t4, e5.arguments = this.parseExprList(i3.parenR, false), this.finishNode(e5, "CallExpression");
          }
          return t4;
        }, e4;
      }(t2);
    }(s2, n3, i2), s2 = function(t2, e3, s3, i3) {
      var r2 = t2.tokTypes, a2 = e3.tokTypes, n4 = t2.isNewLine, h3 = t2.isIdentifierChar, p3 = Object.assign({ allowNamespaces: true, allowNamespacedObjects: true }, i3 || {});
      return function(t3) {
        function e4() {
          return t3.apply(this, arguments) || this;
        }
        o(e4, t3);
        var s4 = e4.prototype;
        return s4.jsx_readToken = function() {
          for (var t4 = "", e5 = this.pos; ; ) {
            this.pos >= this.input.length && this.raise(this.start, "Unterminated JSX contents");
            var s5 = this.input.charCodeAt(this.pos);
            switch (s5) {
              case 60:
              case 123:
                return this.pos === this.start ? 60 === s5 && this.exprAllowed ? (++this.pos, this.finishToken(a2.jsxTagStart)) : this.getTokenFromCode(s5) : (t4 += this.input.slice(e5, this.pos), this.finishToken(a2.jsxText, t4));
              case 38:
                t4 += this.input.slice(e5, this.pos), t4 += this.jsx_readEntity(), e5 = this.pos;
                break;
              case 62:
              case 125:
                this.raise(this.pos, "Unexpected token `" + this.input[this.pos] + "`. Did you mean `" + (62 === s5 ? "&gt;" : "&rbrace;") + '` or `{"' + this.input[this.pos] + '"}`?');
              default:
                n4(s5) ? (t4 += this.input.slice(e5, this.pos), t4 += this.jsx_readNewLine(true), e5 = this.pos) : ++this.pos;
            }
          }
        }, s4.jsx_readNewLine = function(t4) {
          var e5, s5 = this.input.charCodeAt(this.pos);
          return ++this.pos, 13 === s5 && 10 === this.input.charCodeAt(this.pos) ? (++this.pos, e5 = t4 ? "\n" : "\r\n") : e5 = String.fromCharCode(s5), this.options.locations && (++this.curLine, this.lineStart = this.pos), e5;
        }, s4.jsx_readString = function(t4) {
          for (var e5 = "", s5 = ++this.pos; ; ) {
            this.pos >= this.input.length && this.raise(this.start, "Unterminated string constant");
            var i4 = this.input.charCodeAt(this.pos);
            if (i4 === t4) break;
            38 === i4 ? (e5 += this.input.slice(s5, this.pos), e5 += this.jsx_readEntity(), s5 = this.pos) : n4(i4) ? (e5 += this.input.slice(s5, this.pos), e5 += this.jsx_readNewLine(false), s5 = this.pos) : ++this.pos;
          }
          return e5 += this.input.slice(s5, this.pos++), this.finishToken(r2.string, e5);
        }, s4.jsx_readEntity = function() {
          var t4, e5 = "", s5 = 0, i4 = this.input[this.pos];
          "&" !== i4 && this.raise(this.pos, "Entity must start with an ampersand");
          for (var r3 = ++this.pos; this.pos < this.input.length && s5++ < 10; ) {
            if (";" === (i4 = this.input[this.pos++])) {
              "#" === e5[0] ? "x" === e5[1] ? (e5 = e5.substr(2), A.test(e5) && (t4 = String.fromCharCode(parseInt(e5, 16)))) : (e5 = e5.substr(1), S.test(e5) && (t4 = String.fromCharCode(parseInt(e5, 10)))) : t4 = g[e5];
              break;
            }
            e5 += i4;
          }
          return t4 || (this.pos = r3, "&");
        }, s4.jsx_readWord = function() {
          var t4, e5 = this.pos;
          do {
            t4 = this.input.charCodeAt(++this.pos);
          } while (h3(t4) || 45 === t4);
          return this.finishToken(a2.jsxName, this.input.slice(e5, this.pos));
        }, s4.jsx_parseIdentifier = function() {
          var t4 = this.startNode();
          return this.type === a2.jsxName ? t4.name = this.value : this.type.keyword ? t4.name = this.type.keyword : this.unexpected(), this.next(), this.finishNode(t4, "JSXIdentifier");
        }, s4.jsx_parseNamespacedName = function() {
          var t4 = this.start, e5 = this.startLoc, s5 = this.jsx_parseIdentifier();
          if (!p3.allowNamespaces || !this.eat(r2.colon)) return s5;
          var i4 = this.startNodeAt(t4, e5);
          return i4.namespace = s5, i4.name = this.jsx_parseIdentifier(), this.finishNode(i4, "JSXNamespacedName");
        }, s4.jsx_parseElementName = function() {
          if (this.type === a2.jsxTagEnd) return "";
          var t4 = this.start, e5 = this.startLoc, s5 = this.jsx_parseNamespacedName();
          for (this.type !== r2.dot || "JSXNamespacedName" !== s5.type || p3.allowNamespacedObjects || this.unexpected(); this.eat(r2.dot); ) {
            var i4 = this.startNodeAt(t4, e5);
            i4.object = s5, i4.property = this.jsx_parseIdentifier(), s5 = this.finishNode(i4, "JSXMemberExpression");
          }
          return s5;
        }, s4.jsx_parseAttributeValue = function() {
          switch (this.type) {
            case r2.braceL:
              var t4 = this.jsx_parseExpressionContainer();
              return "JSXEmptyExpression" === t4.expression.type && this.raise(t4.start, "JSX attributes must only be assigned a non-empty expression"), t4;
            case a2.jsxTagStart:
            case r2.string:
              return this.parseExprAtom();
            default:
              this.raise(this.start, "JSX value should be either an expression or a quoted JSX text");
          }
        }, s4.jsx_parseEmptyExpression = function() {
          var t4 = this.startNodeAt(this.lastTokEnd, this.lastTokEndLoc);
          return this.finishNodeAt(t4, "JSXEmptyExpression", this.start, this.startLoc);
        }, s4.jsx_parseExpressionContainer = function() {
          var t4 = this.startNode();
          return this.next(), t4.expression = this.type === r2.braceR ? this.jsx_parseEmptyExpression() : this.parseExpression(), this.expect(r2.braceR), this.finishNode(t4, "JSXExpressionContainer");
        }, s4.jsx_parseAttribute = function() {
          var t4 = this.startNode();
          return this.eat(r2.braceL) ? (this.expect(r2.ellipsis), t4.argument = this.parseMaybeAssign(), this.expect(r2.braceR), this.finishNode(t4, "JSXSpreadAttribute")) : (t4.name = this.jsx_parseNamespacedName(), t4.value = this.eat(r2.eq) ? this.jsx_parseAttributeValue() : null, this.finishNode(t4, "JSXAttribute"));
        }, s4.jsx_parseOpeningElementAt = function(t4, e5) {
          var s5 = this.startNodeAt(t4, e5);
          s5.attributes = [];
          var i4 = this.jsx_parseElementName();
          for (i4 && (s5.name = i4); this.type !== r2.slash && this.type !== a2.jsxTagEnd; ) s5.attributes.push(this.jsx_parseAttribute());
          return s5.selfClosing = this.eat(r2.slash), this.expect(a2.jsxTagEnd), this.finishNode(s5, i4 ? "JSXOpeningElement" : "JSXOpeningFragment");
        }, s4.jsx_parseClosingElementAt = function(t4, e5) {
          var s5 = this.startNodeAt(t4, e5), i4 = this.jsx_parseElementName();
          return i4 && (s5.name = i4), this.expect(a2.jsxTagEnd), this.finishNode(s5, i4 ? "JSXClosingElement" : "JSXClosingFragment");
        }, s4.jsx_parseElementAt = function(t4, e5) {
          var s5 = this.startNodeAt(t4, e5), i4 = [], n5 = this.jsx_parseOpeningElementAt(t4, e5), o2 = null;
          if (!n5.selfClosing) {
            t: for (; ; ) switch (this.type) {
              case a2.jsxTagStart:
                if (t4 = this.start, e5 = this.startLoc, this.next(), this.eat(r2.slash)) {
                  o2 = this.jsx_parseClosingElementAt(t4, e5);
                  break t;
                }
                i4.push(this.jsx_parseElementAt(t4, e5));
                break;
              case a2.jsxText:
                i4.push(this.parseExprAtom());
                break;
              case r2.braceL:
                i4.push(this.jsx_parseExpressionContainer());
                break;
              default:
                this.unexpected();
            }
            C(o2.name) !== C(n5.name) && this.raise(o2.start, "Expected corresponding JSX closing tag for <" + C(n5.name) + ">");
          }
          var h4 = n5.name ? "Element" : "Fragment";
          return s5["opening" + h4] = n5, s5["closing" + h4] = o2, s5.children = i4, this.type === r2.relational && "<" === this.value && this.raise(this.start, "Adjacent JSX elements must be wrapped in an enclosing tag"), this.finishNode(s5, "JSX" + h4);
        }, s4.jsx_parseText = function() {
          var t4 = this.parseLiteral(this.value);
          return t4.type = "JSXText", t4;
        }, s4.jsx_parseElement = function() {
          var t4 = this.start, e5 = this.startLoc;
          return this.next(), this.jsx_parseElementAt(t4, e5);
        }, e4;
      }(s3);
    }(i2, n3, s2, null == e2 ? void 0 : e2.jsx), s2 = function(t2, e3, s3) {
      var i3 = e3.tokTypes, r2 = s3.tokTypes;
      return function(t3) {
        function e4() {
          return t3.apply(this, arguments) || this;
        }
        o(e4, t3);
        var s4 = e4.prototype;
        return s4.parseMaybeImportAttributes = function(t4) {
          if (this.type === r2._with || this.type === i3.assert) {
            this.next();
            var e5 = this.parseImportAttributes();
            e5 && (t4.attributes = e5);
          }
        }, s4.parseImportAttributes = function() {
          this.expect(r2.braceL);
          var t4 = this.parseWithEntries();
          return this.expect(r2.braceR), t4;
        }, s4.parseWithEntries = function() {
          var t4 = [], e5 = /* @__PURE__ */ new Set();
          do {
            if (this.type === r2.braceR) break;
            var s5, i4 = this.startNode();
            s5 = this.type === r2.string ? this.parseLiteral(this.value) : this.parseIdent(true), this.next(), i4.key = s5, e5.has(i4.key.name) && this.raise(this.pos, "Duplicated key in attributes"), e5.add(i4.key.name), this.type !== r2.string && this.raise(this.pos, "Only string is supported as an attribute value"), i4.value = this.parseLiteral(this.value), t4.push(this.finishNode(i4, "ImportAttribute"));
          } while (this.eat(r2.comma));
          return t4;
        }, e4;
      }(t2);
    }(s2, n3, i2);
    var z = /* @__PURE__ */ function(t2) {
      function e3(e4, s4, i3) {
        var r2;
        return (r2 = t2.call(this, e4, s4, i3) || this).preValue = null, r2.preToken = null, r2.isLookahead = false, r2.isAmbientContext = false, r2.inAbstractClass = false, r2.inType = false, r2.inDisallowConditionalTypesContext = false, r2.maybeInArrowParameters = false, r2.shouldParseArrowReturnType = void 0, r2.shouldParseAsyncArrowReturnType = void 0, r2.decoratorStack = [[]], r2.importsStack = [[]], r2.importOrExportOuterKind = void 0, r2.tsParseConstModifier = r2.tsParseModifiers.bind(function(t3) {
          if (void 0 === t3) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
          return t3;
        }(r2), { allowedModifiers: ["const"], disallowedModifiers: ["in", "out"], errorTemplate: b.InvalidModifierOnTypeParameterPositions }), r2;
      }
      o(e3, t2);
      var s3, m2, g2, A2 = e3.prototype;
      return A2.getTokenFromCodeInType = function(e4) {
        return 62 === e4 || 60 === e4 ? this.finishOp(p2.relational, 1) : t2.prototype.getTokenFromCode.call(this, e4);
      }, A2.readToken = function(e4) {
        if (!this.inType) {
          var s4 = this.curContext();
          if (s4 === R.tc_expr) return this.jsx_readToken();
          if (s4 === R.tc_oTag || s4 === R.tc_cTag) {
            if (u2(e4)) return this.jsx_readWord();
            if (62 == e4) return ++this.pos, this.finishToken(_.jsxTagEnd);
            if ((34 === e4 || 39 === e4) && s4 == R.tc_oTag) return this.jsx_readString(e4);
          }
          if (60 === e4 && this.exprAllowed && 33 !== this.input.charCodeAt(this.pos + 1)) return ++this.pos, this.finishToken(_.jsxTagStart);
        }
        return t2.prototype.readToken.call(this, e4);
      }, A2.getTokenFromCode = function(e4) {
        return this.inType ? this.getTokenFromCodeInType(e4) : 64 === e4 ? (++this.pos, this.finishToken(_.at)) : t2.prototype.getTokenFromCode.call(this, e4);
      }, A2.isAbstractClass = function() {
        return this.ts_isContextual(_.abstract) && this.lookahead().type === p2._class;
      }, A2.finishNode = function(e4, s4) {
        return "" !== e4.type && 0 !== e4.end ? e4 : t2.prototype.finishNode.call(this, e4, s4);
      }, A2.tryParse = function(t3, e4) {
        void 0 === e4 && (e4 = this.cloneCurLookaheadState());
        var s4 = { node: null };
        try {
          return { node: t3(function(t4) {
            throw void 0 === t4 && (t4 = null), s4.node = t4, s4;
          }), error: null, thrown: false, aborted: false, failState: null };
        } catch (t4) {
          var i3 = this.getCurLookaheadState();
          if (this.setLookaheadState(e4), t4 instanceof SyntaxError) return { node: null, error: t4, thrown: true, aborted: false, failState: i3 };
          if (t4 === s4) return { node: s4.node, error: null, thrown: false, aborted: true, failState: i3 };
          throw t4;
        }
      }, A2.setOptionalParametersError = function(t3, e4) {
        var s4;
        t3.optionalParametersLoc = null != (s4 = null == e4 ? void 0 : e4.loc) ? s4 : this.startLoc;
      }, A2.reScan_lt_gt = function() {
        this.type === p2.relational && (this.pos -= 1, this.readToken_lt_gt(this.fullCharCodeAtPos()));
      }, A2.reScan_lt = function() {
        var t3 = this.type;
        return t3 === p2.bitShift ? (this.pos -= 2, this.finishOp(p2.relational, 1), p2.relational) : t3;
      }, A2.resetEndLocation = function(t3, e4) {
        void 0 === e4 && (e4 = this.lastTokEndLoc), t3.end = e4.column, t3.loc.end = e4, this.options.ranges && (t3.range[1] = e4.column);
      }, A2.startNodeAtNode = function(e4) {
        return t2.prototype.startNodeAt.call(this, e4.start, e4.loc.start);
      }, A2.nextTokenStart = function() {
        return this.nextTokenStartSince(this.pos);
      }, A2.tsHasSomeModifiers = function(t3, e4) {
        return e4.some(function(e5) {
          return O(e5) ? t3.accessibility === e5 : !!t3[e5];
        });
      }, A2.tsIsStartOfStaticBlocks = function() {
        return this.isContextual("static") && 123 === this.lookaheadCharCode();
      }, A2.tsCheckForInvalidTypeCasts = function(t3) {
        var e4 = this;
        t3.forEach(function(t4) {
          "TSTypeCastExpression" === (null == t4 ? void 0 : t4.type) && e4.raise(t4.typeAnnotation.start, b.UnexpectedTypeAnnotation);
        });
      }, A2.atPossibleAsyncArrow = function(t3) {
        return "Identifier" === t3.type && "async" === t3.name && this.lastTokEndLoc.column === t3.end && !this.canInsertSemicolon() && t3.end - t3.start == 5 && t3.start === this.potentialArrowAt;
      }, A2.tsIsIdentifier = function() {
        return q(this.type);
      }, A2.tsTryParseTypeOrTypePredicateAnnotation = function() {
        return this.match(p2.colon) ? this.tsParseTypeOrTypePredicateAnnotation(p2.colon) : void 0;
      }, A2.tsTryParseGenericAsyncArrowFunction = function(e4, s4, i3) {
        var r2 = this;
        if (this.tsMatchLeftRelational()) {
          var a2 = this.maybeInArrowParameters;
          this.maybeInArrowParameters = true;
          var n4 = this.tsTryParseAndCatch(function() {
            var i4 = r2.startNodeAt(e4, s4);
            return i4.typeParameters = r2.tsParseTypeParameters(), t2.prototype.parseFunctionParams.call(r2, i4), i4.returnType = r2.tsTryParseTypeOrTypePredicateAnnotation(), r2.expect(p2.arrow), i4;
          });
          if (this.maybeInArrowParameters = a2, n4) return t2.prototype.parseArrowExpression.call(this, n4, null, true, i3);
        }
      }, A2.tsParseTypeArgumentsInExpression = function() {
        if (this.reScan_lt() === p2.relational) return this.tsParseTypeArguments();
      }, A2.tsInNoContext = function(t3) {
        var e4 = this.context;
        this.context = [e4[0]];
        try {
          return t3();
        } finally {
          this.context = e4;
        }
      }, A2.tsTryParseTypeAnnotation = function() {
        return this.match(p2.colon) ? this.tsParseTypeAnnotation() : void 0;
      }, A2.isUnparsedContextual = function(t3, e4) {
        var s4 = t3 + e4.length;
        if (this.input.slice(t3, s4) === e4) {
          var i3 = this.input.charCodeAt(s4);
          return !(D2(i3) || 55296 == (64512 & i3));
        }
        return false;
      }, A2.isAbstractConstructorSignature = function() {
        return this.ts_isContextual(_.abstract) && this.lookahead().type === p2._new;
      }, A2.nextTokenStartSince = function(t3) {
        return E.lastIndex = t3, E.test(this.input) ? E.lastIndex : t3;
      }, A2.lookaheadCharCode = function() {
        return this.input.charCodeAt(this.nextTokenStart());
      }, A2.compareLookaheadState = function(t3, e4) {
        for (var s4 = 0, i3 = Object.keys(t3); s4 < i3.length; s4++) {
          var r2 = i3[s4];
          if (t3[r2] !== e4[r2]) return false;
        }
        return true;
      }, A2.createLookaheadState = function() {
        this.value = null, this.context = [this.curContext()];
      }, A2.getCurLookaheadState = function() {
        return { endLoc: this.endLoc, lastTokEnd: this.lastTokEnd, lastTokStart: this.lastTokStart, lastTokStartLoc: this.lastTokStartLoc, pos: this.pos, value: this.value, type: this.type, start: this.start, end: this.end, context: this.context, startLoc: this.startLoc, lastTokEndLoc: this.lastTokEndLoc, curLine: this.curLine, lineStart: this.lineStart, curPosition: this.curPosition, containsEsc: this.containsEsc };
      }, A2.cloneCurLookaheadState = function() {
        return { pos: this.pos, value: this.value, type: this.type, start: this.start, end: this.end, context: this.context && this.context.slice(), startLoc: this.startLoc, lastTokEndLoc: this.lastTokEndLoc, endLoc: this.endLoc, lastTokEnd: this.lastTokEnd, lastTokStart: this.lastTokStart, lastTokStartLoc: this.lastTokStartLoc, curLine: this.curLine, lineStart: this.lineStart, curPosition: this.curPosition, containsEsc: this.containsEsc };
      }, A2.setLookaheadState = function(t3) {
        this.pos = t3.pos, this.value = t3.value, this.endLoc = t3.endLoc, this.lastTokEnd = t3.lastTokEnd, this.lastTokStart = t3.lastTokStart, this.lastTokStartLoc = t3.lastTokStartLoc, this.type = t3.type, this.start = t3.start, this.end = t3.end, this.context = t3.context, this.startLoc = t3.startLoc, this.lastTokEndLoc = t3.lastTokEndLoc, this.curLine = t3.curLine, this.lineStart = t3.lineStart, this.curPosition = t3.curPosition, this.containsEsc = t3.containsEsc;
      }, A2.tsLookAhead = function(t3) {
        var e4 = this.getCurLookaheadState(), s4 = t3();
        return this.setLookaheadState(e4), s4;
      }, A2.lookahead = function(t3) {
        var e4 = this.getCurLookaheadState();
        if (this.createLookaheadState(), this.isLookahead = true, void 0 !== t3) for (var s4 = 0; s4 < t3; s4++) this.nextToken();
        else this.nextToken();
        this.isLookahead = false;
        var i3 = this.getCurLookaheadState();
        return this.setLookaheadState(e4), i3;
      }, A2.readWord = function() {
        var t3 = this.readWord1(), e4 = p2.name;
        return this.keywords.test(t3) ? e4 = l2[t3] : new RegExp(j).test(t3) && (e4 = _[t3]), this.finishToken(e4, t3);
      }, A2.skipBlockComment = function() {
        var t3;
        this.isLookahead || (t3 = this.options.onComment && this.curPosition());
        var e4 = this.pos, s4 = this.input.indexOf("*/", this.pos += 2);
        if (-1 === s4 && this.raise(this.pos - 2, "Unterminated comment"), this.pos = s4 + 2, this.options.locations) for (var i3, r2 = e4; (i3 = K(this.input, r2, this.pos)) > -1; ) ++this.curLine, r2 = this.lineStart = i3;
        this.isLookahead || this.options.onComment && this.options.onComment(true, this.input.slice(e4 + 2, s4), e4, this.pos, t3, this.curPosition());
      }, A2.skipLineComment = function(t3) {
        var e4, s4 = this.pos;
        this.isLookahead || (e4 = this.options.onComment && this.curPosition());
        for (var i3 = this.input.charCodeAt(this.pos += t3); this.pos < this.input.length && !y2(i3); ) i3 = this.input.charCodeAt(++this.pos);
        this.isLookahead || this.options.onComment && this.options.onComment(false, this.input.slice(s4 + t3, this.pos), s4, this.pos, e4, this.curPosition());
      }, A2.finishToken = function(t3, e4) {
        this.preValue = this.value, this.preToken = this.type, this.end = this.pos, this.options.locations && (this.endLoc = this.curPosition());
        var s4 = this.type;
        this.type = t3, this.value = e4, this.isLookahead || this.updateContext(s4);
      }, A2.resetStartLocation = function(t3, e4, s4) {
        t3.start = e4, t3.loc.start = s4, this.options.ranges && (t3.range[0] = e4);
      }, A2.isLineTerminator = function() {
        return this.eat(p2.semi) || t2.prototype.canInsertSemicolon.call(this);
      }, A2.hasFollowingLineBreak = function() {
        return x.lastIndex = this.end, x.test(this.input);
      }, A2.addExtra = function(t3, e4, s4, i3) {
        if (void 0 === i3 && (i3 = true), t3) {
          var r2 = t3.extra = t3.extra || {};
          i3 ? r2[e4] = s4 : Object.defineProperty(r2, e4, { enumerable: i3, value: s4 });
        }
      }, A2.isLiteralPropertyName = function() {
        return F(this.type);
      }, A2.hasPrecedingLineBreak = function() {
        return d2.test(this.input.slice(this.lastTokEndLoc.index, this.start));
      }, A2.createIdentifier = function(t3, e4) {
        return t3.name = e4, this.finishNode(t3, "Identifier");
      }, A2.resetStartLocationFromNode = function(t3, e4) {
        this.resetStartLocation(t3, e4.start, e4.loc.start);
      }, A2.isThisParam = function(t3) {
        return "Identifier" === t3.type && "this" === t3.name;
      }, A2.isLookaheadContextual = function(t3) {
        var e4 = this.nextTokenStart();
        return this.isUnparsedContextual(e4, t3);
      }, A2.ts_type_isContextual = function(t3, e4) {
        return t3 === e4 && !this.containsEsc;
      }, A2.ts_isContextual = function(t3) {
        return this.type === t3 && !this.containsEsc;
      }, A2.ts_isContextualWithState = function(t3, e4) {
        return t3.type === e4 && !t3.containsEsc;
      }, A2.isContextualWithState = function(t3, e4) {
        return e4.type === p2.name && e4.value === t3 && !e4.containsEsc;
      }, A2.tsIsStartOfMappedType = function() {
        return this.next(), this.eat(p2.plusMin) ? this.ts_isContextual(_.readonly) : (this.ts_isContextual(_.readonly) && this.next(), !!this.match(p2.bracketL) && (this.next(), !!this.tsIsIdentifier() && (this.next(), this.match(p2._in))));
      }, A2.tsInDisallowConditionalTypesContext = function(t3) {
        var e4 = this.inDisallowConditionalTypesContext;
        this.inDisallowConditionalTypesContext = true;
        try {
          return t3();
        } finally {
          this.inDisallowConditionalTypesContext = e4;
        }
      }, A2.tsTryParseType = function() {
        return this.tsEatThenParseType(p2.colon);
      }, A2.match = function(t3) {
        return this.type === t3;
      }, A2.matchJsx = function(t3) {
        return this.type === n3.tokTypes[t3];
      }, A2.ts_eatWithState = function(t3, e4, s4) {
        if (t3 === s4.type) {
          for (var i3 = 0; i3 < e4; i3++) this.next();
          return true;
        }
        return false;
      }, A2.ts_eatContextualWithState = function(t3, e4, s4) {
        if (j.test(t3)) {
          if (this.ts_isContextualWithState(s4, _[t3])) {
            for (var i3 = 0; i3 < e4; i3++) this.next();
            return true;
          }
          return false;
        }
        if (!this.isContextualWithState(t3, s4)) return false;
        for (var r2 = 0; r2 < e4; r2++) this.next();
        return true;
      }, A2.canHaveLeadingDecorator = function() {
        return this.match(p2._class);
      }, A2.eatContextual = function(e4) {
        return j.test(e4) ? !!this.ts_isContextual(_[e4]) && (this.next(), true) : t2.prototype.eatContextual.call(this, e4);
      }, A2.tsIsExternalModuleReference = function() {
        return this.isContextual("require") && 40 === this.lookaheadCharCode();
      }, A2.tsParseExternalModuleReference = function() {
        var t3 = this.startNode();
        return this.expectContextual("require"), this.expect(p2.parenL), this.match(p2.string) || this.unexpected(), t3.expression = this.parseExprAtom(), this.expect(p2.parenR), this.finishNode(t3, "TSExternalModuleReference");
      }, A2.tsParseEntityName = function(t3) {
        void 0 === t3 && (t3 = true);
        for (var e4 = this.parseIdent(t3); this.eat(p2.dot); ) {
          var s4 = this.startNodeAtNode(e4);
          s4.left = e4, s4.right = this.parseIdent(t3), e4 = this.finishNode(s4, "TSQualifiedName");
        }
        return e4;
      }, A2.tsParseEnumMember = function() {
        var t3 = this.startNode();
        return t3.id = this.match(p2.string) ? this.parseLiteral(this.value) : this.parseIdent(true), this.eat(p2.eq) && (t3.initializer = this.parseMaybeAssign()), this.finishNode(t3, "TSEnumMember");
      }, A2.tsParseEnumDeclaration = function(t3, e4) {
        return void 0 === e4 && (e4 = {}), e4.const && (t3.const = true), e4.declare && (t3.declare = true), this.expectContextual("enum"), t3.id = this.parseIdent(), this.checkLValSimple(t3.id), this.expect(p2.braceL), t3.members = this.tsParseDelimitedList("EnumMembers", this.tsParseEnumMember.bind(this)), this.expect(p2.braceR), this.finishNode(t3, "TSEnumDeclaration");
      }, A2.tsParseModuleBlock = function() {
        var e4 = this.startNode();
        for (t2.prototype.enterScope.call(this, 512), this.expect(p2.braceL), e4.body = []; this.type !== p2.braceR; ) {
          var s4 = this.parseStatement(null, true);
          e4.body.push(s4);
        }
        return this.next(), t2.prototype.exitScope.call(this), this.finishNode(e4, "TSModuleBlock");
      }, A2.tsParseAmbientExternalModuleDeclaration = function(e4) {
        return this.ts_isContextual(_.global) ? (e4.global = true, e4.id = this.parseIdent()) : this.match(p2.string) ? e4.id = this.parseLiteral(this.value) : this.unexpected(), this.match(p2.braceL) ? (t2.prototype.enterScope.call(this, f), e4.body = this.tsParseModuleBlock(), t2.prototype.exitScope.call(this)) : t2.prototype.semicolon.call(this), this.finishNode(e4, "TSModuleDeclaration");
      }, A2.tsTryParseDeclare = function(t3) {
        var e4 = this;
        if (!this.isLineTerminator()) {
          var s4, i3 = this.type;
          return this.isContextual("let") && (i3 = p2._var, s4 = "let"), this.tsInAmbientContext(function() {
            if (i3 === p2._function) return t3.declare = true, e4.parseFunctionStatement(t3, false, true);
            if (i3 === p2._class) return t3.declare = true, e4.parseClass(t3, true);
            if (i3 === _.enum) return e4.tsParseEnumDeclaration(t3, { declare: true });
            if (i3 === _.global) return e4.tsParseAmbientExternalModuleDeclaration(t3);
            if (i3 === p2._const || i3 === p2._var) return e4.match(p2._const) && e4.isLookaheadContextual("enum") ? (e4.expect(p2._const), e4.tsParseEnumDeclaration(t3, { const: true, declare: true })) : (t3.declare = true, e4.parseVarStatement(t3, s4 || e4.value, true));
            if (i3 === _.interface) {
              var r2 = e4.tsParseInterfaceDeclaration(t3, { declare: true });
              if (r2) return r2;
            }
            return q(i3) ? e4.tsParseDeclaration(t3, e4.value, true) : void 0;
          });
        }
      }, A2.tsIsListTerminator = function(t3) {
        switch (t3) {
          case "EnumMembers":
          case "TypeMembers":
            return this.match(p2.braceR);
          case "HeritageClauseElement":
            return this.match(p2.braceL);
          case "TupleElementTypes":
            return this.match(p2.bracketR);
          case "TypeParametersOrArguments":
            return this.tsMatchRightRelational();
        }
      }, A2.tsParseDelimitedListWorker = function(t3, e4, s4, i3) {
        for (var r2 = [], a2 = -1; !this.tsIsListTerminator(t3); ) {
          a2 = -1;
          var n4 = e4();
          if (null == n4) return;
          if (r2.push(n4), !this.eat(p2.comma)) {
            if (this.tsIsListTerminator(t3)) break;
            return void (s4 && this.expect(p2.comma));
          }
          a2 = this.lastTokStart;
        }
        return i3 && (i3.value = a2), r2;
      }, A2.tsParseDelimitedList = function(t3, e4, s4) {
        return function(t4) {
          if (null == t4) throw new Error("Unexpected " + t4 + " value.");
          return t4;
        }(this.tsParseDelimitedListWorker(t3, e4, true, s4));
      }, A2.tsParseBracketedList = function(t3, e4, s4, i3, r2) {
        i3 || this.expect(s4 ? p2.bracketL : p2.relational);
        var a2 = this.tsParseDelimitedList(t3, e4, r2);
        return this.expect(s4 ? p2.bracketR : p2.relational), a2;
      }, A2.tsParseTypeParameterName = function() {
        return this.parseIdent().name;
      }, A2.tsEatThenParseType = function(t3) {
        return this.match(t3) ? this.tsNextThenParseType() : void 0;
      }, A2.tsExpectThenParseType = function(t3) {
        var e4 = this;
        return this.tsDoThenParseType(function() {
          return e4.expect(t3);
        });
      }, A2.tsNextThenParseType = function() {
        var t3 = this;
        return this.tsDoThenParseType(function() {
          return t3.next();
        });
      }, A2.tsDoThenParseType = function(t3) {
        var e4 = this;
        return this.tsInType(function() {
          return t3(), e4.tsParseType();
        });
      }, A2.tsSkipParameterStart = function() {
        if (q(this.type) || this.match(p2._this)) return this.next(), true;
        if (this.match(p2.braceL)) try {
          return this.parseObj(true), true;
        } catch (t3) {
          return false;
        }
        if (this.match(p2.bracketL)) {
          this.next();
          try {
            return this.parseBindingList(p2.bracketR, true, true), true;
          } catch (t3) {
            return false;
          }
        }
        return false;
      }, A2.tsIsUnambiguouslyStartOfFunctionType = function() {
        if (this.next(), this.match(p2.parenR) || this.match(p2.ellipsis)) return true;
        if (this.tsSkipParameterStart()) {
          if (this.match(p2.colon) || this.match(p2.comma) || this.match(p2.question) || this.match(p2.eq)) return true;
          if (this.match(p2.parenR) && (this.next(), this.match(p2.arrow))) return true;
        }
        return false;
      }, A2.tsIsStartOfFunctionType = function() {
        return !!this.tsMatchLeftRelational() || this.match(p2.parenL) && this.tsLookAhead(this.tsIsUnambiguouslyStartOfFunctionType.bind(this));
      }, A2.tsInAllowConditionalTypesContext = function(t3) {
        var e4 = this.inDisallowConditionalTypesContext;
        this.inDisallowConditionalTypesContext = false;
        try {
          return t3();
        } finally {
          this.inDisallowConditionalTypesContext = e4;
        }
      }, A2.tsParseBindingListForSignature = function() {
        var e4 = this;
        return t2.prototype.parseBindingList.call(this, p2.parenR, true, true).map(function(t3) {
          return "Identifier" !== t3.type && "RestElement" !== t3.type && "ObjectPattern" !== t3.type && "ArrayPattern" !== t3.type && e4.raise(t3.start, b.UnsupportedSignatureParameterKind(t3.type)), t3;
        });
      }, A2.tsParseTypePredicateAsserts = function() {
        if (this.type !== _.asserts) return false;
        var t3 = this.containsEsc;
        return this.next(), !(!q(this.type) && !this.match(p2._this) || (t3 && this.raise(this.lastTokStart, "Escape sequence in keyword asserts"), 0));
      }, A2.tsParseThisTypeNode = function() {
        var t3 = this.startNode();
        return this.next(), this.finishNode(t3, "TSThisType");
      }, A2.tsParseTypeAnnotation = function(t3, e4) {
        var s4 = this;
        return void 0 === t3 && (t3 = true), void 0 === e4 && (e4 = this.startNode()), this.tsInType(function() {
          t3 && s4.expect(p2.colon), e4.typeAnnotation = s4.tsParseType();
        }), this.finishNode(e4, "TSTypeAnnotation");
      }, A2.tsParseThisTypePredicate = function(t3) {
        this.next();
        var e4 = this.startNodeAtNode(t3);
        return e4.parameterName = t3, e4.typeAnnotation = this.tsParseTypeAnnotation(false), e4.asserts = false, this.finishNode(e4, "TSTypePredicate");
      }, A2.tsParseThisTypeOrThisTypePredicate = function() {
        var t3 = this.tsParseThisTypeNode();
        return this.isContextual("is") && !this.hasPrecedingLineBreak() ? this.tsParseThisTypePredicate(t3) : t3;
      }, A2.tsParseTypePredicatePrefix = function() {
        var t3 = this.parseIdent();
        if (this.isContextual("is") && !this.hasPrecedingLineBreak()) return this.next(), t3;
      }, A2.tsParseTypeOrTypePredicateAnnotation = function(t3) {
        var e4 = this;
        return this.tsInType(function() {
          var s4 = e4.startNode();
          e4.expect(t3);
          var i3 = e4.startNode(), r2 = !!e4.tsTryParse(e4.tsParseTypePredicateAsserts.bind(e4));
          if (r2 && e4.match(p2._this)) {
            var a2 = e4.tsParseThisTypeOrThisTypePredicate();
            return "TSThisType" === a2.type ? (i3.parameterName = a2, i3.asserts = true, i3.typeAnnotation = null, a2 = e4.finishNode(i3, "TSTypePredicate")) : (e4.resetStartLocationFromNode(a2, i3), a2.asserts = true), s4.typeAnnotation = a2, e4.finishNode(s4, "TSTypeAnnotation");
          }
          var n4 = e4.tsIsIdentifier() && e4.tsTryParse(e4.tsParseTypePredicatePrefix.bind(e4));
          if (!n4) return r2 ? (i3.parameterName = e4.parseIdent(), i3.asserts = r2, i3.typeAnnotation = null, s4.typeAnnotation = e4.finishNode(i3, "TSTypePredicate"), e4.finishNode(s4, "TSTypeAnnotation")) : e4.tsParseTypeAnnotation(false, s4);
          var o2 = e4.tsParseTypeAnnotation(false);
          return i3.parameterName = n4, i3.typeAnnotation = o2, i3.asserts = r2, s4.typeAnnotation = e4.finishNode(i3, "TSTypePredicate"), e4.finishNode(s4, "TSTypeAnnotation");
        });
      }, A2.tsFillSignature = function(t3, e4) {
        var s4 = t3 === p2.arrow;
        e4.typeParameters = this.tsTryParseTypeParameters(), this.expect(p2.parenL), e4.parameters = this.tsParseBindingListForSignature(), (s4 || this.match(t3)) && (e4.typeAnnotation = this.tsParseTypeOrTypePredicateAnnotation(t3));
      }, A2.tsTryNextParseConstantContext = function() {
        if (this.lookahead().type !== p2._const) return null;
        this.next();
        var t3 = this.tsParseTypeReference();
        return t3.typeParameters && this.raise(t3.typeName.start, b.CannotFindName({ name: "const" })), t3;
      }, A2.tsParseFunctionOrConstructorType = function(t3, e4) {
        var s4 = this, i3 = this.startNode();
        return "TSConstructorType" === t3 && (i3.abstract = !!e4, e4 && this.next(), this.next()), this.tsInAllowConditionalTypesContext(function() {
          return s4.tsFillSignature(p2.arrow, i3);
        }), this.finishNode(i3, t3);
      }, A2.tsParseUnionOrIntersectionType = function(t3, e4, s4) {
        var i3 = this.startNode(), r2 = this.eat(s4), a2 = [];
        do {
          a2.push(e4());
        } while (this.eat(s4));
        return 1 !== a2.length || r2 ? (i3.types = a2, this.finishNode(i3, t3)) : a2[0];
      }, A2.tsCheckTypeAnnotationForReadOnly = function(t3) {
        switch (t3.typeAnnotation.type) {
          case "TSTupleType":
          case "TSArrayType":
            return;
          default:
            this.raise(t3.start, b.UnexpectedReadonly);
        }
      }, A2.tsParseTypeOperator = function() {
        var t3 = this.startNode(), e4 = this.value;
        return this.next(), t3.operator = e4, t3.typeAnnotation = this.tsParseTypeOperatorOrHigher(), "readonly" === e4 && this.tsCheckTypeAnnotationForReadOnly(t3), this.finishNode(t3, "TSTypeOperator");
      }, A2.tsParseConstraintForInferType = function() {
        var t3 = this;
        if (this.eat(p2._extends)) {
          var e4 = this.tsInDisallowConditionalTypesContext(function() {
            return t3.tsParseType();
          });
          if (this.inDisallowConditionalTypesContext || !this.match(p2.question)) return e4;
        }
      }, A2.tsParseInferType = function() {
        var t3 = this, e4 = this.startNode();
        this.expectContextual("infer");
        var s4 = this.startNode();
        return s4.name = this.tsParseTypeParameterName(), s4.constraint = this.tsTryParse(function() {
          return t3.tsParseConstraintForInferType();
        }), e4.typeParameter = this.finishNode(s4, "TSTypeParameter"), this.finishNode(e4, "TSInferType");
      }, A2.tsParseLiteralTypeNode = function() {
        var t3 = this, e4 = this.startNode();
        return e4.literal = function() {
          switch (t3.type) {
            case p2.num:
            case p2.string:
            case p2._true:
            case p2._false:
              return t3.parseExprAtom();
            default:
              t3.unexpected();
          }
        }(), this.finishNode(e4, "TSLiteralType");
      }, A2.tsParseImportType = function() {
        var t3 = this.startNode();
        return this.expect(p2._import), this.expect(p2.parenL), this.match(p2.string) || this.raise(this.start, b.UnsupportedImportTypeArgument), t3.argument = this.parseExprAtom(), this.expect(p2.parenR), this.eat(p2.dot) && (t3.qualifier = this.tsParseEntityName()), this.tsMatchLeftRelational() && (t3.typeParameters = this.tsParseTypeArguments()), this.finishNode(t3, "TSImportType");
      }, A2.tsParseTypeQuery = function() {
        var t3 = this.startNode();
        return this.expect(p2._typeof), t3.exprName = this.match(p2._import) ? this.tsParseImportType() : this.tsParseEntityName(), !this.hasPrecedingLineBreak() && this.tsMatchLeftRelational() && (t3.typeParameters = this.tsParseTypeArguments()), this.finishNode(t3, "TSTypeQuery");
      }, A2.tsParseMappedTypeParameter = function() {
        var t3 = this.startNode();
        return t3.name = this.tsParseTypeParameterName(), t3.constraint = this.tsExpectThenParseType(p2._in), this.finishNode(t3, "TSTypeParameter");
      }, A2.tsParseMappedType = function() {
        var t3 = this.startNode();
        return this.expect(p2.braceL), this.match(p2.plusMin) ? (t3.readonly = this.value, this.next(), this.expectContextual("readonly")) : this.eatContextual("readonly") && (t3.readonly = true), this.expect(p2.bracketL), t3.typeParameter = this.tsParseMappedTypeParameter(), t3.nameType = this.eatContextual("as") ? this.tsParseType() : null, this.expect(p2.bracketR), this.match(p2.plusMin) ? (t3.optional = this.value, this.next(), this.expect(p2.question)) : this.eat(p2.question) && (t3.optional = true), t3.typeAnnotation = this.tsTryParseType(), this.semicolon(), this.expect(p2.braceR), this.finishNode(t3, "TSMappedType");
      }, A2.tsParseTypeLiteral = function() {
        var t3 = this.startNode();
        return t3.members = this.tsParseObjectTypeMembers(), this.finishNode(t3, "TSTypeLiteral");
      }, A2.tsParseTupleElementType = function() {
        var t3 = this.startLoc, e4 = this.start, s4 = this.eat(p2.ellipsis), i3 = this.tsParseType(), r2 = this.eat(p2.question);
        if (this.eat(p2.colon)) {
          var a2 = this.startNodeAtNode(i3);
          a2.optional = r2, "TSTypeReference" !== i3.type || i3.typeParameters || "Identifier" !== i3.typeName.type ? (this.raise(i3.start, b.InvalidTupleMemberLabel), a2.label = i3) : a2.label = i3.typeName, a2.elementType = this.tsParseType(), i3 = this.finishNode(a2, "TSNamedTupleMember");
        } else if (r2) {
          var n4 = this.startNodeAtNode(i3);
          n4.typeAnnotation = i3, i3 = this.finishNode(n4, "TSOptionalType");
        }
        if (s4) {
          var o2 = this.startNodeAt(e4, t3);
          o2.typeAnnotation = i3, i3 = this.finishNode(o2, "TSRestType");
        }
        return i3;
      }, A2.tsParseTupleType = function() {
        var t3 = this, e4 = this.startNode();
        e4.elementTypes = this.tsParseBracketedList("TupleElementTypes", this.tsParseTupleElementType.bind(this), true, false);
        var s4 = false, i3 = null;
        return e4.elementTypes.forEach(function(e5) {
          var r2 = e5.type;
          !s4 || "TSRestType" === r2 || "TSOptionalType" === r2 || "TSNamedTupleMember" === r2 && e5.optional || t3.raise(e5.start, b.OptionalTypeBeforeRequired), s4 || (s4 = "TSNamedTupleMember" === r2 && e5.optional || "TSOptionalType" === r2);
          var a2 = r2;
          "TSRestType" === r2 && (a2 = (e5 = e5.typeAnnotation).type);
          var n4 = "TSNamedTupleMember" === a2;
          null != i3 || (i3 = n4), i3 !== n4 && t3.raise(e5.start, b.MixedLabeledAndUnlabeledElements);
        }), this.finishNode(e4, "TSTupleType");
      }, A2.tsParseTemplateLiteralType = function() {
        var t3 = this.startNode();
        return t3.literal = this.parseTemplate({ isTagged: false }), this.finishNode(t3, "TSLiteralType");
      }, A2.tsParseTypeReference = function() {
        var t3 = this.startNode();
        return t3.typeName = this.tsParseEntityName(), !this.hasPrecedingLineBreak() && this.tsMatchLeftRelational() && (t3.typeParameters = this.tsParseTypeArguments()), this.finishNode(t3, "TSTypeReference");
      }, A2.tsMatchLeftRelational = function() {
        return this.match(p2.relational) && "<" === this.value;
      }, A2.tsMatchRightRelational = function() {
        return this.match(p2.relational) && ">" === this.value;
      }, A2.tsParseParenthesizedType = function() {
        var t3 = this.startNode();
        return this.expect(p2.parenL), t3.typeAnnotation = this.tsParseType(), this.expect(p2.parenR), this.finishNode(t3, "TSParenthesizedType");
      }, A2.tsParseNonArrayType = function() {
        switch (this.type) {
          case p2.string:
          case p2.num:
          case p2._true:
          case p2._false:
            return this.tsParseLiteralTypeNode();
          case p2.plusMin:
            if ("-" === this.value) {
              var t3 = this.startNode();
              return this.lookahead().type !== p2.num && this.unexpected(), t3.literal = this.parseMaybeUnary(), this.finishNode(t3, "TSLiteralType");
            }
            break;
          case p2._this:
            return this.tsParseThisTypeOrThisTypePredicate();
          case p2._typeof:
            return this.tsParseTypeQuery();
          case p2._import:
            return this.tsParseImportType();
          case p2.braceL:
            return this.tsLookAhead(this.tsIsStartOfMappedType.bind(this)) ? this.tsParseMappedType() : this.tsParseTypeLiteral();
          case p2.bracketL:
            return this.tsParseTupleType();
          case p2.parenL:
            return this.tsParseParenthesizedType();
          case p2.backQuote:
          case p2.dollarBraceL:
            return this.tsParseTemplateLiteralType();
          default:
            var e4 = this.type;
            if (q(e4) || e4 === p2._void || e4 === p2._null) {
              var s4 = e4 === p2._void ? "TSVoidKeyword" : e4 === p2._null ? "TSNullKeyword" : function(t4) {
                switch (t4) {
                  case "any":
                    return "TSAnyKeyword";
                  case "boolean":
                    return "TSBooleanKeyword";
                  case "bigint":
                    return "TSBigIntKeyword";
                  case "never":
                    return "TSNeverKeyword";
                  case "number":
                    return "TSNumberKeyword";
                  case "object":
                    return "TSObjectKeyword";
                  case "string":
                    return "TSStringKeyword";
                  case "symbol":
                    return "TSSymbolKeyword";
                  case "undefined":
                    return "TSUndefinedKeyword";
                  case "unknown":
                    return "TSUnknownKeyword";
                  default:
                    return;
                }
              }(this.value);
              if (void 0 !== s4 && 46 !== this.lookaheadCharCode()) {
                var i3 = this.startNode();
                return this.next(), this.finishNode(i3, s4);
              }
              return this.tsParseTypeReference();
            }
        }
        this.unexpected();
      }, A2.tsParseArrayTypeOrHigher = function() {
        for (var t3 = this.tsParseNonArrayType(); !this.hasPrecedingLineBreak() && this.eat(p2.bracketL); ) if (this.match(p2.bracketR)) {
          var e4 = this.startNodeAtNode(t3);
          e4.elementType = t3, this.expect(p2.bracketR), t3 = this.finishNode(e4, "TSArrayType");
        } else {
          var s4 = this.startNodeAtNode(t3);
          s4.objectType = t3, s4.indexType = this.tsParseType(), this.expect(p2.bracketR), t3 = this.finishNode(s4, "TSIndexedAccessType");
        }
        return t3;
      }, A2.tsParseTypeOperatorOrHigher = function() {
        var t3 = this;
        return V(this.type) && !this.containsEsc ? this.tsParseTypeOperator() : this.isContextual("infer") ? this.tsParseInferType() : this.tsInAllowConditionalTypesContext(function() {
          return t3.tsParseArrayTypeOrHigher();
        });
      }, A2.tsParseIntersectionTypeOrHigher = function() {
        return this.tsParseUnionOrIntersectionType("TSIntersectionType", this.tsParseTypeOperatorOrHigher.bind(this), p2.bitwiseAND);
      }, A2.tsParseUnionTypeOrHigher = function() {
        return this.tsParseUnionOrIntersectionType("TSUnionType", this.tsParseIntersectionTypeOrHigher.bind(this), p2.bitwiseOR);
      }, A2.tsParseNonConditionalType = function() {
        return this.tsIsStartOfFunctionType() ? this.tsParseFunctionOrConstructorType("TSFunctionType") : this.match(p2._new) ? this.tsParseFunctionOrConstructorType("TSConstructorType") : this.isAbstractConstructorSignature() ? this.tsParseFunctionOrConstructorType("TSConstructorType", true) : this.tsParseUnionTypeOrHigher();
      }, A2.tsParseType = function() {
        var t3 = this;
        k$2(this.inType);
        var e4 = this.tsParseNonConditionalType();
        if (this.inDisallowConditionalTypesContext || this.hasPrecedingLineBreak() || !this.eat(p2._extends)) return e4;
        var s4 = this.startNodeAtNode(e4);
        return s4.checkType = e4, s4.extendsType = this.tsInDisallowConditionalTypesContext(function() {
          return t3.tsParseNonConditionalType();
        }), this.expect(p2.question), s4.trueType = this.tsInAllowConditionalTypesContext(function() {
          return t3.tsParseType();
        }), this.expect(p2.colon), s4.falseType = this.tsInAllowConditionalTypesContext(function() {
          return t3.tsParseType();
        }), this.finishNode(s4, "TSConditionalType");
      }, A2.tsIsUnambiguouslyIndexSignature = function() {
        return this.next(), !!q(this.type) && (this.next(), this.match(p2.colon));
      }, A2.tsInType = function(t3) {
        var e4 = this.inType;
        this.inType = true;
        try {
          return t3();
        } finally {
          this.inType = e4;
        }
      }, A2.tsTryParseIndexSignature = function(t3) {
        if (this.match(p2.bracketL) && this.tsLookAhead(this.tsIsUnambiguouslyIndexSignature.bind(this))) {
          this.expect(p2.bracketL);
          var e4 = this.parseIdent();
          e4.typeAnnotation = this.tsParseTypeAnnotation(), this.resetEndLocation(e4), this.expect(p2.bracketR), t3.parameters = [e4];
          var s4 = this.tsTryParseTypeAnnotation();
          return s4 && (t3.typeAnnotation = s4), this.tsParseTypeMemberSemicolon(), this.finishNode(t3, "TSIndexSignature");
        }
      }, A2.tsParseNoneModifiers = function(t3) {
        this.tsParseModifiers({ modified: t3, allowedModifiers: [], disallowedModifiers: ["in", "out"], errorTemplate: b.InvalidModifierOnTypeParameterPositions });
      }, A2.tsParseTypeParameter = function(t3) {
        void 0 === t3 && (t3 = this.tsParseNoneModifiers.bind(this));
        var e4 = this.startNode();
        return t3(e4), e4.name = this.tsParseTypeParameterName(), e4.constraint = this.tsEatThenParseType(p2._extends), e4.default = this.tsEatThenParseType(p2.eq), this.finishNode(e4, "TSTypeParameter");
      }, A2.tsParseTypeParameters = function(t3) {
        var e4 = this.startNode();
        this.tsMatchLeftRelational() || this.matchJsx("jsxTagStart") ? this.next() : this.unexpected();
        var s4 = { value: -1 };
        return e4.params = this.tsParseBracketedList("TypeParametersOrArguments", this.tsParseTypeParameter.bind(this, t3), false, true, s4), 0 === e4.params.length && this.raise(this.start, b.EmptyTypeParameters), -1 !== s4.value && this.addExtra(e4, "trailingComma", s4.value), this.finishNode(e4, "TSTypeParameterDeclaration");
      }, A2.tsTryParseTypeParameters = function(t3) {
        if (this.tsMatchLeftRelational()) return this.tsParseTypeParameters(t3);
      }, A2.tsTryParse = function(t3) {
        var e4 = this.getCurLookaheadState(), s4 = t3();
        return void 0 !== s4 && false !== s4 ? s4 : void this.setLookaheadState(e4);
      }, A2.tsTokenCanFollowModifier = function() {
        return (this.match(p2.bracketL) || this.match(p2.braceL) || this.match(p2.star) || this.match(p2.ellipsis) || this.match(p2.privateId) || this.isLiteralPropertyName()) && !this.hasPrecedingLineBreak();
      }, A2.tsNextTokenCanFollowModifier = function() {
        return this.next(true), this.tsTokenCanFollowModifier();
      }, A2.tsParseModifier = function(t3, e4) {
        if (q(this.type) || this.type === p2._in) {
          var s4 = this.value;
          if (-1 !== t3.indexOf(s4) && !this.containsEsc) {
            if (e4 && this.tsIsStartOfStaticBlocks()) return;
            if (this.tsTryParse(this.tsNextTokenCanFollowModifier.bind(this))) return s4;
          }
        }
      }, A2.tsParseModifiersByMap = function(t3) {
        for (var e4 = t3.modified, s4 = t3.map, i3 = 0, r2 = Object.keys(s4); i3 < r2.length; i3++) {
          var a2 = r2[i3];
          e4[a2] = s4[a2];
        }
      }, A2.tsParseModifiers = function(t3) {
        for (var e4 = this, s4 = t3.modified, i3 = t3.allowedModifiers, r2 = t3.disallowedModifiers, a2 = t3.stopOnStartOfClassStaticBlock, n4 = t3.errorTemplate, o2 = void 0 === n4 ? b.InvalidModifierOnTypeMember : n4, h3 = {}, p3 = function(t4, i4, r3, a3) {
          i4 === r3 && s4[a3] && e4.raise(t4.column, b.InvalidModifiersOrder({ orderedModifiers: [r3, a3] }));
        }, c2 = function(t4, i4, r3, a3) {
          (s4[r3] && i4 === a3 || s4[a3] && i4 === r3) && e4.raise(t4.column, b.IncompatibleModifiers({ modifiers: [r3, a3] }));
        }; ; ) {
          var l3 = this.startLoc, u3 = this.tsParseModifier(i3.concat(null != r2 ? r2 : []), a2);
          if (!u3) break;
          O(u3) ? s4.accessibility ? this.raise(this.start, b.DuplicateAccessibilityModifier()) : (p3(l3, u3, u3, "override"), p3(l3, u3, u3, "static"), p3(l3, u3, u3, "readonly"), p3(l3, u3, u3, "accessor"), h3.accessibility = u3, s4.accessibility = u3) : N(u3) ? s4[u3] ? this.raise(this.start, b.DuplicateModifier({ modifier: u3 })) : (p3(l3, u3, "in", "out"), h3[u3] = u3, s4[u3] = true) : I(u3) ? s4[u3] ? this.raise(this.start, b.DuplicateModifier({ modifier: u3 })) : (c2(l3, u3, "accessor", "readonly"), c2(l3, u3, "accessor", "static"), c2(l3, u3, "accessor", "override"), h3[u3] = u3, s4[u3] = true) : Object.hasOwnProperty.call(s4, u3) ? this.raise(this.start, b.DuplicateModifier({ modifier: u3 })) : (p3(l3, u3, "static", "readonly"), p3(l3, u3, "static", "override"), p3(l3, u3, "override", "readonly"), p3(l3, u3, "abstract", "override"), c2(l3, u3, "declare", "override"), c2(l3, u3, "static", "abstract"), h3[u3] = u3, s4[u3] = true), null != r2 && r2.includes(u3) && this.raise(this.start, o2);
        }
        return h3;
      }, A2.tsParseInOutModifiers = function(t3) {
        this.tsParseModifiers({ modified: t3, allowedModifiers: ["in", "out"], disallowedModifiers: ["public", "private", "protected", "readonly", "declare", "abstract", "override"], errorTemplate: b.InvalidModifierOnTypeParameter });
      }, A2.tsParseTypeArguments = function() {
        var t3 = this, e4 = this.startNode();
        return e4.params = this.tsInType(function() {
          return t3.tsInNoContext(function() {
            return t3.expect(p2.relational), t3.tsParseDelimitedList("TypeParametersOrArguments", t3.tsParseType.bind(t3));
          });
        }), 0 === e4.params.length && this.raise(this.start, b.EmptyTypeArguments), this.exprAllowed = false, this.expect(p2.relational), this.finishNode(e4, "TSTypeParameterInstantiation");
      }, A2.tsParseHeritageClause = function(t3) {
        var e4 = this, s4 = this.start, i3 = this.tsParseDelimitedList("HeritageClauseElement", function() {
          var t4 = e4.startNode();
          return t4.expression = e4.tsParseEntityName(), e4.tsMatchLeftRelational() && (t4.typeParameters = e4.tsParseTypeArguments()), e4.finishNode(t4, "TSExpressionWithTypeArguments");
        });
        return i3.length || this.raise(s4, b.EmptyHeritageClauseType({ token: t3 })), i3;
      }, A2.tsParseTypeMemberSemicolon = function() {
        this.eat(p2.comma) || this.isLineTerminator() || this.expect(p2.semi);
      }, A2.tsTryParseAndCatch = function(t3) {
        var e4 = this.tryParse(function(e5) {
          return t3() || e5();
        });
        if (!e4.aborted && e4.node) return e4.error && this.setLookaheadState(e4.failState), e4.node;
      }, A2.tsParseSignatureMember = function(t3, e4) {
        return this.tsFillSignature(p2.colon, e4), this.tsParseTypeMemberSemicolon(), this.finishNode(e4, t3);
      }, A2.tsParsePropertyOrMethodSignature = function(t3, e4) {
        this.eat(p2.question) && (t3.optional = true);
        var s4 = t3;
        if (this.match(p2.parenL) || this.tsMatchLeftRelational()) {
          e4 && this.raise(t3.start, b.ReadonlyForMethodSignature);
          var i3 = s4;
          i3.kind && this.tsMatchLeftRelational() && this.raise(this.start, b.AccesorCannotHaveTypeParameters), this.tsFillSignature(p2.colon, i3), this.tsParseTypeMemberSemicolon();
          var r2 = "parameters", a2 = "typeAnnotation";
          if ("get" === i3.kind) i3[r2].length > 0 && (this.raise(this.start, "A 'get' accesor must not have any formal parameters."), this.isThisParam(i3[r2][0]) && this.raise(this.start, b.AccesorCannotDeclareThisParameter));
          else if ("set" === i3.kind) {
            if (1 !== i3[r2].length) this.raise(this.start, "A 'get' accesor must not have any formal parameters.");
            else {
              var n4 = i3[r2][0];
              this.isThisParam(n4) && this.raise(this.start, b.AccesorCannotDeclareThisParameter), "Identifier" === n4.type && n4.optional && this.raise(this.start, b.SetAccesorCannotHaveOptionalParameter), "RestElement" === n4.type && this.raise(this.start, b.SetAccesorCannotHaveRestParameter);
            }
            i3[a2] && this.raise(i3[a2].start, b.SetAccesorCannotHaveReturnType);
          } else i3.kind = "method";
          return this.finishNode(i3, "TSMethodSignature");
        }
        var o2 = s4;
        e4 && (o2.readonly = true);
        var h3 = this.tsTryParseTypeAnnotation();
        return h3 && (o2.typeAnnotation = h3), this.tsParseTypeMemberSemicolon(), this.finishNode(o2, "TSPropertySignature");
      }, A2.tsParseTypeMember = function() {
        var t3 = this.startNode();
        if (this.match(p2.parenL) || this.tsMatchLeftRelational()) return this.tsParseSignatureMember("TSCallSignatureDeclaration", t3);
        if (this.match(p2._new)) {
          var e4 = this.startNode();
          return this.next(), this.match(p2.parenL) || this.tsMatchLeftRelational() ? this.tsParseSignatureMember("TSConstructSignatureDeclaration", t3) : (t3.key = this.createIdentifier(e4, "new"), this.tsParsePropertyOrMethodSignature(t3, false));
        }
        return this.tsParseModifiers({ modified: t3, allowedModifiers: ["readonly"], disallowedModifiers: ["declare", "abstract", "private", "protected", "public", "static", "override"] }), this.tsTryParseIndexSignature(t3) || (this.parsePropertyName(t3), t3.computed || "Identifier" !== t3.key.type || "get" !== t3.key.name && "set" !== t3.key.name || !this.tsTokenCanFollowModifier() || (t3.kind = t3.key.name, this.parsePropertyName(t3)), this.tsParsePropertyOrMethodSignature(t3, !!t3.readonly));
      }, A2.tsParseList = function(t3, e4) {
        for (var s4 = []; !this.tsIsListTerminator(t3); ) s4.push(e4());
        return s4;
      }, A2.tsParseObjectTypeMembers = function() {
        this.expect(p2.braceL);
        var t3 = this.tsParseList("TypeMembers", this.tsParseTypeMember.bind(this));
        return this.expect(p2.braceR), t3;
      }, A2.tsParseInterfaceDeclaration = function(t3, e4) {
        if (void 0 === e4 && (e4 = {}), this.hasFollowingLineBreak()) return null;
        this.expectContextual("interface"), e4.declare && (t3.declare = true), q(this.type) ? (t3.id = this.parseIdent(), this.checkLValSimple(t3.id, 7)) : (t3.id = null, this.raise(this.start, b.MissingInterfaceName)), t3.typeParameters = this.tsTryParseTypeParameters(this.tsParseInOutModifiers.bind(this)), this.eat(p2._extends) && (t3.extends = this.tsParseHeritageClause("extends"));
        var s4 = this.startNode();
        return s4.body = this.tsInType(this.tsParseObjectTypeMembers.bind(this)), t3.body = this.finishNode(s4, "TSInterfaceBody"), this.finishNode(t3, "TSInterfaceDeclaration");
      }, A2.tsParseAbstractDeclaration = function(t3) {
        if (this.match(p2._class)) return t3.abstract = true, this.parseClass(t3, true);
        if (this.ts_isContextual(_.interface)) {
          if (!this.hasFollowingLineBreak()) return t3.abstract = true, this.tsParseInterfaceDeclaration(t3);
        } else this.unexpected(t3.start);
      }, A2.tsIsDeclarationStart = function() {
        return H(this.type);
      }, A2.tsParseExpressionStatement = function(e4, s4) {
        switch (s4.name) {
          case "declare":
            var i3 = this.tsTryParseDeclare(e4);
            if (i3) return i3.declare = true, i3;
            break;
          case "global":
            if (this.match(p2.braceL)) {
              t2.prototype.enterScope.call(this, f);
              var r2 = e4;
              return r2.global = true, r2.id = s4, r2.body = this.tsParseModuleBlock(), t2.prototype.exitScope.call(this), this.finishNode(r2, "TSModuleDeclaration");
            }
            break;
          default:
            return this.tsParseDeclaration(e4, s4.name, false);
        }
      }, A2.tsParseModuleReference = function() {
        return this.tsIsExternalModuleReference() ? this.tsParseExternalModuleReference() : this.tsParseEntityName(false);
      }, A2.tsIsExportDefaultSpecifier = function() {
        var t3 = this.type, e4 = this.isAsyncFunction(), s4 = this.isLet();
        if (q(t3)) {
          if (e4 && !this.containsEsc || s4) return false;
          if ((t3 === _.type || t3 === _.interface) && !this.containsEsc) {
            var i3 = this.lookahead();
            if (q(i3.type) && !this.isContextualWithState("from", i3) || i3.type === p2.braceL) return false;
          }
        } else if (!this.match(p2._default)) return false;
        var r2 = this.nextTokenStart(), a2 = this.isUnparsedContextual(r2, "from");
        if (44 === this.input.charCodeAt(r2) || q(this.type) && a2) return true;
        if (this.match(p2._default) && a2) {
          var n4 = this.input.charCodeAt(this.nextTokenStartSince(r2 + 4));
          return 34 === n4 || 39 === n4;
        }
        return false;
      }, A2.tsInAmbientContext = function(t3) {
        var e4 = this.isAmbientContext;
        this.isAmbientContext = true;
        try {
          return t3();
        } finally {
          this.isAmbientContext = e4;
        }
      }, A2.tsCheckLineTerminator = function(t3) {
        return t3 ? !this.hasFollowingLineBreak() && (this.next(), true) : !this.isLineTerminator();
      }, A2.tsParseModuleOrNamespaceDeclaration = function(e4, s4) {
        if (void 0 === s4 && (s4 = false), e4.id = this.parseIdent(), s4 || this.checkLValSimple(e4.id, 8), this.eat(p2.dot)) {
          var i3 = this.startNode();
          this.tsParseModuleOrNamespaceDeclaration(i3, true), e4.body = i3;
        } else t2.prototype.enterScope.call(this, f), e4.body = this.tsParseModuleBlock(), t2.prototype.exitScope.call(this);
        return this.finishNode(e4, "TSModuleDeclaration");
      }, A2.checkLValSimple = function(e4, s4, i3) {
        return void 0 === s4 && (s4 = 0), t2.prototype.checkLValSimple.call(this, e4, s4, i3);
      }, A2.tsParseTypeAliasDeclaration = function(t3) {
        var e4 = this;
        return t3.id = this.parseIdent(), this.checkLValSimple(t3.id, 6), t3.typeAnnotation = this.tsInType(function() {
          if (t3.typeParameters = e4.tsTryParseTypeParameters(e4.tsParseInOutModifiers.bind(e4)), e4.expect(p2.eq), e4.ts_isContextual(_.interface) && e4.lookahead().type !== p2.dot) {
            var s4 = e4.startNode();
            return e4.next(), e4.finishNode(s4, "TSIntrinsicKeyword");
          }
          return e4.tsParseType();
        }), this.semicolon(), this.finishNode(t3, "TSTypeAliasDeclaration");
      }, A2.tsParseDeclaration = function(t3, e4, s4) {
        switch (e4) {
          case "abstract":
            if (this.tsCheckLineTerminator(s4) && (this.match(p2._class) || q(this.type))) return this.tsParseAbstractDeclaration(t3);
            break;
          case "module":
            if (this.tsCheckLineTerminator(s4)) {
              if (this.match(p2.string)) return this.tsParseAmbientExternalModuleDeclaration(t3);
              if (q(this.type)) return this.tsParseModuleOrNamespaceDeclaration(t3);
            }
            break;
          case "namespace":
            if (this.tsCheckLineTerminator(s4) && q(this.type)) return this.tsParseModuleOrNamespaceDeclaration(t3);
            break;
          case "type":
            if (this.tsCheckLineTerminator(s4) && q(this.type)) return this.tsParseTypeAliasDeclaration(t3);
        }
      }, A2.tsTryParseExportDeclaration = function() {
        return this.tsParseDeclaration(this.startNode(), this.value, true);
      }, A2.tsParseImportEqualsDeclaration = function(e4, s4) {
        e4.isExport = s4 || false, e4.id = this.parseIdent(), this.checkLValSimple(e4.id, 2), t2.prototype.expect.call(this, p2.eq);
        var i3 = this.tsParseModuleReference();
        return "type" === e4.importKind && "TSExternalModuleReference" !== i3.type && this.raise(i3.start, b.ImportAliasHasImportType), e4.moduleReference = i3, t2.prototype.semicolon.call(this), this.finishNode(e4, "TSImportEqualsDeclaration");
      }, A2.isExportDefaultSpecifier = function() {
        if (this.tsIsDeclarationStart()) return false;
        var t3 = this.type;
        if (q(t3)) {
          if (this.isContextual("async") || this.isContextual("let")) return false;
          if ((t3 === _.type || t3 === _.interface) && !this.containsEsc) {
            var e4 = this.lookahead();
            if (q(e4.type) && !this.isContextualWithState("from", e4) || e4.type === p2.braceL) return false;
          }
        } else if (!this.match(p2._default)) return false;
        var s4 = this.nextTokenStart(), i3 = this.isUnparsedContextual(s4, "from");
        if (44 === this.input.charCodeAt(s4) || q(this.type) && i3) return true;
        if (this.match(p2._default) && i3) {
          var r2 = this.input.charCodeAt(this.nextTokenStartSince(s4 + 4));
          return 34 === r2 || 39 === r2;
        }
        return false;
      }, A2.parseTemplate = function(t3) {
        var e4 = (void 0 === t3 ? {} : t3).isTagged, s4 = void 0 !== e4 && e4, i3 = this.startNode();
        this.next(), i3.expressions = [];
        var r2 = this.parseTemplateElement({ isTagged: s4 });
        for (i3.quasis = [r2]; !r2.tail; ) this.type === p2.eof && this.raise(this.pos, "Unterminated template literal"), this.expect(p2.dollarBraceL), i3.expressions.push(this.inType ? this.tsParseType() : this.parseExpression()), this.expect(p2.braceR), i3.quasis.push(r2 = this.parseTemplateElement({ isTagged: s4 }));
        return this.next(), this.finishNode(i3, "TemplateLiteral");
      }, A2.parseFunction = function(t3, e4, s4, i3, r2) {
        this.initFunction(t3), (this.options.ecmaVersion >= 9 || this.options.ecmaVersion >= 6 && !i3) && (this.type === p2.star && 2 & e4 && this.unexpected(), t3.generator = this.eat(p2.star)), this.options.ecmaVersion >= 8 && (t3.async = !!i3), 1 & e4 && (t3.id = 4 & e4 && this.type !== p2.name ? null : this.parseIdent());
        var a2 = this.yieldPos, n4 = this.awaitPos, o2 = this.awaitIdentPos, h3 = this.maybeInArrowParameters;
        this.maybeInArrowParameters = false, this.yieldPos = 0, this.awaitPos = 0, this.awaitIdentPos = 0, this.enterScope(w(t3.async, t3.generator)), 1 & e4 || (t3.id = this.type === p2.name ? this.parseIdent() : null), this.parseFunctionParams(t3);
        var c2 = 1 & e4;
        return this.parseFunctionBody(t3, s4, false, r2, { isFunctionDeclaration: c2 }), this.yieldPos = a2, this.awaitPos = n4, this.awaitIdentPos = o2, 1 & e4 && t3.id && !(2 & e4) && this.checkLValSimple(t3.id, t3.body ? this.strict || t3.generator || t3.async ? this.treatFunctionsAsVar ? 1 : 2 : 3 : 0), this.maybeInArrowParameters = h3, this.finishNode(t3, c2 ? "FunctionDeclaration" : "FunctionExpression");
      }, A2.parseFunctionBody = function(e4, s4, i3, r2, a2) {
        void 0 === s4 && (s4 = false), void 0 === i3 && (i3 = false), void 0 === r2 && (r2 = false), this.match(p2.colon) && (e4.returnType = this.tsParseTypeOrTypePredicateAnnotation(p2.colon));
        var n4 = null != a2 && a2.isFunctionDeclaration ? "TSDeclareFunction" : null != a2 && a2.isClassMethod ? "TSDeclareMethod" : void 0;
        return n4 && !this.match(p2.braceL) && this.isLineTerminator() ? this.finishNode(e4, n4) : "TSDeclareFunction" === n4 && this.isAmbientContext && (this.raise(e4.start, b.DeclareFunctionHasImplementation), e4.declare) ? (t2.prototype.parseFunctionBody.call(this, e4, s4, i3, false), this.finishNode(e4, n4)) : (t2.prototype.parseFunctionBody.call(this, e4, s4, i3, r2), e4);
      }, A2.parseNew = function() {
        var t3;
        this.containsEsc && this.raiseRecoverable(this.start, "Escape sequence in keyword new");
        var e4 = this.startNode(), s4 = this.parseIdent(true);
        if (this.options.ecmaVersion >= 6 && this.eat(p2.dot)) {
          e4.meta = s4;
          var i3 = this.containsEsc;
          return e4.property = this.parseIdent(true), "target" !== e4.property.name && this.raiseRecoverable(e4.property.start, "The only valid meta property for new is 'new.target'"), i3 && this.raiseRecoverable(e4.start, "'new.target' must not contain escaped characters"), this.allowNewDotTarget || this.raiseRecoverable(e4.start, "'new.target' can only be used in functions and class static block"), this.finishNode(e4, "MetaProperty");
        }
        var r2 = this.start, a2 = this.startLoc, n4 = this.type === p2._import;
        e4.callee = this.parseSubscripts(this.parseExprAtom(), r2, a2, true, false), n4 && "ImportExpression" === e4.callee.type && this.raise(r2, "Cannot use new with import()");
        var o2 = e4.callee;
        return "TSInstantiationExpression" !== o2.type || null != (t3 = o2.extra) && t3.parenthesized || (e4.typeParameters = o2.typeParameters, e4.callee = o2.expression), e4.arguments = this.eat(p2.parenL) ? this.parseExprList(p2.parenR, this.options.ecmaVersion >= 8, false) : [], this.finishNode(e4, "NewExpression");
      }, A2.parseExprOp = function(e4, s4, i3, r2, a2) {
        var n4;
        if (p2._in.binop > r2 && !this.hasPrecedingLineBreak() && (this.isContextual("as") && (n4 = "TSAsExpression"), h2 && this.isContextual("satisfies") && (n4 = "TSSatisfiesExpression"), n4)) {
          var o2 = this.startNodeAt(s4, i3);
          o2.expression = e4;
          var c2 = this.tsTryNextParseConstantContext();
          return o2.typeAnnotation = c2 || this.tsNextThenParseType(), this.finishNode(o2, n4), this.reScan_lt_gt(), this.parseExprOp(o2, s4, i3, r2, a2);
        }
        return t2.prototype.parseExprOp.call(this, e4, s4, i3, r2, a2);
      }, A2.parseImportSpecifiers = function() {
        var t3 = [], e4 = true;
        if (n3.tokenIsIdentifier(this.type) && (t3.push(this.parseImportDefaultSpecifier()), !this.eat(p2.comma))) return t3;
        if (this.type === p2.star) return t3.push(this.parseImportNamespaceSpecifier()), t3;
        for (this.expect(p2.braceL); !this.eat(p2.braceR); ) {
          if (e4) e4 = false;
          else if (this.expect(p2.comma), this.afterTrailingComma(p2.braceR)) break;
          t3.push(this.parseImportSpecifier());
        }
        return t3;
      }, A2.parseImport = function(t3) {
        var e4 = this.lookahead();
        if (t3.importKind = "value", this.importOrExportOuterKind = "value", q(e4.type) || this.match(p2.star) || this.match(p2.braceL)) {
          var s4 = this.lookahead(2);
          if (s4.type !== p2.comma && !this.isContextualWithState("from", s4) && s4.type !== p2.eq && this.ts_eatContextualWithState("type", 1, e4) && (this.importOrExportOuterKind = "type", t3.importKind = "type", e4 = this.lookahead(), s4 = this.lookahead(2)), q(e4.type) && s4.type === p2.eq) {
            this.next();
            var i3 = this.tsParseImportEqualsDeclaration(t3);
            return this.importOrExportOuterKind = "value", i3;
          }
        }
        return this.next(), this.type === p2.string ? (t3.specifiers = [], t3.source = this.parseExprAtom()) : (t3.specifiers = this.parseImportSpecifiers(), this.expectContextual("from"), t3.source = this.type === p2.string ? this.parseExprAtom() : this.unexpected()), this.parseMaybeImportAttributes(t3), this.semicolon(), this.finishNode(t3, "ImportDeclaration"), this.importOrExportOuterKind = "value", "type" === t3.importKind && t3.specifiers.length > 1 && "ImportDefaultSpecifier" === t3.specifiers[0].type && this.raise(t3.start, b.TypeImportCannotSpecifyDefaultAndNamed), t3;
      }, A2.parseExportDefaultDeclaration = function() {
        if (this.isAbstractClass()) {
          var e4 = this.startNode();
          return this.next(), e4.abstract = true, this.parseClass(e4, true);
        }
        if (this.match(_.interface)) {
          var s4 = this.tsParseInterfaceDeclaration(this.startNode());
          if (s4) return s4;
        }
        return t2.prototype.parseExportDefaultDeclaration.call(this);
      }, A2.parseExportAllDeclaration = function(t3, e4) {
        return this.options.ecmaVersion >= 11 && (this.eatContextual("as") ? (t3.exported = this.parseModuleExportName(), this.checkExport(e4, t3.exported, this.lastTokStart)) : t3.exported = null), this.expectContextual("from"), this.type !== p2.string && this.unexpected(), t3.source = this.parseExprAtom(), this.parseMaybeImportAttributes(t3), this.semicolon(), this.finishNode(t3, "ExportAllDeclaration");
      }, A2.parseDynamicImport = function(t3) {
        if (this.next(), t3.source = this.parseMaybeAssign(), this.eat(p2.comma)) {
          var e4 = this.parseExpression();
          t3.arguments = [e4];
        }
        if (!this.eat(p2.parenR)) {
          var s4 = this.start;
          this.eat(p2.comma) && this.eat(p2.parenR) ? this.raiseRecoverable(s4, "Trailing comma is not allowed in import()") : this.unexpected(s4);
        }
        return this.finishNode(t3, "ImportExpression");
      }, A2.parseExport = function(t3, e4) {
        var s4 = this.lookahead();
        if (this.ts_eatWithState(p2._import, 2, s4)) {
          this.ts_isContextual(_.type) && 61 !== this.lookaheadCharCode() ? (t3.importKind = "type", this.importOrExportOuterKind = "type", this.next()) : (t3.importKind = "value", this.importOrExportOuterKind = "value");
          var i3 = this.tsParseImportEqualsDeclaration(t3, true);
          return this.importOrExportOuterKind = void 0, i3;
        }
        if (this.ts_eatWithState(p2.eq, 2, s4)) {
          var r2 = t3;
          return r2.expression = this.parseExpression(), this.semicolon(), this.importOrExportOuterKind = void 0, this.finishNode(r2, "TSExportAssignment");
        }
        if (this.ts_eatContextualWithState("as", 2, s4)) {
          var a2 = t3;
          return this.expectContextual("namespace"), a2.id = this.parseIdent(), this.semicolon(), this.importOrExportOuterKind = void 0, this.finishNode(a2, "TSNamespaceExportDeclaration");
        }
        if (this.ts_isContextualWithState(s4, _.type) && this.lookahead(2).type === p2.braceL ? (this.next(), this.importOrExportOuterKind = "type", t3.exportKind = "type") : (this.importOrExportOuterKind = "value", t3.exportKind = "value"), this.next(), this.eat(p2.star)) return this.parseExportAllDeclaration(t3, e4);
        if (this.eat(p2._default)) return this.checkExport(e4, "default", this.lastTokStart), t3.declaration = this.parseExportDefaultDeclaration(), this.finishNode(t3, "ExportDefaultDeclaration");
        if (this.shouldParseExportStatement()) t3.declaration = this.parseExportDeclaration(t3), "VariableDeclaration" === t3.declaration.type ? this.checkVariableExport(e4, t3.declaration.declarations) : this.checkExport(e4, t3.declaration.id, t3.declaration.id.start), t3.specifiers = [], t3.source = null;
        else {
          if (t3.declaration = null, t3.specifiers = this.parseExportSpecifiers(e4), this.eatContextual("from")) this.type !== p2.string && this.unexpected(), t3.source = this.parseExprAtom(), this.parseMaybeImportAttributes(t3);
          else {
            for (var n4, o2 = c(t3.specifiers); !(n4 = o2()).done; ) {
              var h3 = n4.value;
              this.checkUnreserved(h3.local), this.checkLocalExport(h3.local), "Literal" === h3.local.type && this.raise(h3.local.start, "A string literal cannot be used as an exported binding without `from`.");
            }
            t3.source = null;
          }
          this.semicolon();
        }
        return this.finishNode(t3, "ExportNamedDeclaration");
      }, A2.checkExport = function(t3, e4, s4) {
        t3 && ("string" != typeof e4 && (e4 = "Identifier" === e4.type ? e4.name : e4.value), t3[e4] = true);
      }, A2.parseMaybeDefault = function(e4, s4, i3) {
        var r2 = t2.prototype.parseMaybeDefault.call(this, e4, s4, i3);
        return "AssignmentPattern" === r2.type && r2.typeAnnotation && r2.right.start < r2.typeAnnotation.start && this.raise(r2.typeAnnotation.start, b.TypeAnnotationAfterAssign), r2;
      }, A2.typeCastToParameter = function(t3) {
        return t3.expression.typeAnnotation = t3.typeAnnotation, this.resetEndLocation(t3.expression, t3.typeAnnotation.end), t3.expression;
      }, A2.toAssignableList = function(e4, s4) {
        for (var i3 = 0; i3 < e4.length; i3++) {
          var r2 = e4[i3];
          "TSTypeCastExpression" === (null == r2 ? void 0 : r2.type) && (e4[i3] = this.typeCastToParameter(r2));
        }
        return t2.prototype.toAssignableList.call(this, e4, s4);
      }, A2.reportReservedArrowTypeParam = function(t3) {
      }, A2.parseExprAtom = function(e4, s4, i3) {
        if (this.type === _.jsxText) return this.jsx_parseText();
        if (this.type === _.jsxTagStart) return this.jsx_parseElement();
        if (this.type === _.at) return this.parseDecorators(), this.parseExprAtom();
        if (q(this.type)) {
          var r2 = this.potentialArrowAt === this.start, a2 = this.start, n4 = this.startLoc, o2 = this.containsEsc, h3 = this.parseIdent(false);
          if (this.options.ecmaVersion >= 8 && !o2 && "async" === h3.name && !this.canInsertSemicolon() && this.eat(p2._function)) return this.overrideContext(M2.f_expr), this.parseFunction(this.startNodeAt(a2, n4), 0, false, true, s4);
          if (r2 && !this.canInsertSemicolon()) {
            if (this.eat(p2.arrow)) return this.parseArrowExpression(this.startNodeAt(a2, n4), [h3], false, s4);
            if (this.options.ecmaVersion >= 8 && "async" === h3.name && this.type === p2.name && !o2 && (!this.potentialArrowInForAwait || "of" !== this.value || this.containsEsc)) return h3 = this.parseIdent(false), !this.canInsertSemicolon() && this.eat(p2.arrow) || this.unexpected(), this.parseArrowExpression(this.startNodeAt(a2, n4), [h3], true, s4);
          }
          return h3;
        }
        return t2.prototype.parseExprAtom.call(this, e4, s4, i3);
      }, A2.parseExprAtomDefault = function() {
        if (q(this.type)) {
          var t3 = this.potentialArrowAt === this.start, e4 = this.containsEsc, s4 = this.parseIdent();
          if (!e4 && "async" === s4.name && !this.canInsertSemicolon()) {
            var i3 = this.type;
            if (i3 === p2._function) return this.next(), this.parseFunction(this.startNodeAtNode(s4), void 0, true, true);
            if (q(i3)) {
              if (61 === this.lookaheadCharCode()) {
                var r2 = this.parseIdent(false);
                return !this.canInsertSemicolon() && this.eat(p2.arrow) || this.unexpected(), this.parseArrowExpression(this.startNodeAtNode(s4), [r2], true);
              }
              return s4;
            }
          }
          return t3 && this.match(p2.arrow) && !this.canInsertSemicolon() ? (this.next(), this.parseArrowExpression(this.startNodeAtNode(s4), [s4], false)) : s4;
        }
        this.unexpected();
      }, A2.parseIdentNode = function() {
        var e4 = this.startNode();
        return U(this.type) ? (e4.name = this.value, e4) : t2.prototype.parseIdentNode.call(this);
      }, A2.parseVarStatement = function(e4, s4, i3) {
        void 0 === i3 && (i3 = false);
        var r2 = this.isAmbientContext;
        this.next(), t2.prototype.parseVar.call(this, e4, false, s4, i3 || r2), this.semicolon();
        var a2 = this.finishNode(e4, "VariableDeclaration");
        if (!r2) return a2;
        for (var n4, o2 = c(a2.declarations); !(n4 = o2()).done; ) {
          var h3 = n4.value, p3 = h3.init;
          p3 && ("const" !== s4 || h3.id.typeAnnotation ? this.raise(p3.start, b.InitializerNotAllowedInAmbientContext) : "StringLiteral" !== p3.type && "BooleanLiteral" !== p3.type && "NumericLiteral" !== p3.type && "BigIntLiteral" !== p3.type && ("TemplateLiteral" !== p3.type || p3.expressions.length > 0) && !L(p3) && this.raise(p3.start, b.ConstInitiailizerMustBeStringOrNumericLiteralOrLiteralEnumReference));
        }
        return a2;
      }, A2.parseStatement = function(e4, s4, i3) {
        if (this.match(_.at) && this.parseDecorators(true), this.match(p2._const) && this.isLookaheadContextual("enum")) {
          var r2 = this.startNode();
          return this.expect(p2._const), this.tsParseEnumDeclaration(r2, { const: true });
        }
        if (this.ts_isContextual(_.enum)) return this.tsParseEnumDeclaration(this.startNode());
        if (this.ts_isContextual(_.interface)) {
          var a2 = this.tsParseInterfaceDeclaration(this.startNode());
          if (a2) return a2;
        }
        return t2.prototype.parseStatement.call(this, e4, s4, i3);
      }, A2.parseAccessModifier = function() {
        return this.tsParseModifier(["public", "protected", "private"]);
      }, A2.parsePostMemberNameModifiers = function(t3) {
        this.eat(p2.question) && (t3.optional = true), t3.readonly && this.match(p2.parenL) && this.raise(t3.start, b.ClassMethodHasReadonly), t3.declare && this.match(p2.parenL) && this.raise(t3.start, b.ClassMethodHasDeclare);
      }, A2.parseExpressionStatement = function(e4, s4) {
        return ("Identifier" === s4.type ? this.tsParseExpressionStatement(e4, s4) : void 0) || t2.prototype.parseExpressionStatement.call(this, e4, s4);
      }, A2.shouldParseExportStatement = function() {
        return !!this.tsIsDeclarationStart() || !!this.match(_.at) || t2.prototype.shouldParseExportStatement.call(this);
      }, A2.parseConditional = function(t3, e4, s4, i3, r2) {
        if (this.eat(p2.question)) {
          var a2 = this.startNodeAt(e4, s4);
          return a2.test = t3, a2.consequent = this.parseMaybeAssign(), this.expect(p2.colon), a2.alternate = this.parseMaybeAssign(i3), this.finishNode(a2, "ConditionalExpression");
        }
        return t3;
      }, A2.parseMaybeConditional = function(t3, e4) {
        var s4 = this, i3 = this.start, r2 = this.startLoc, a2 = this.parseExprOps(t3, e4);
        if (this.checkExpressionErrors(e4)) return a2;
        if (!this.maybeInArrowParameters || !this.match(p2.question)) return this.parseConditional(a2, i3, r2, t3, e4);
        var n4 = this.tryParse(function() {
          return s4.parseConditional(a2, i3, r2, t3, e4);
        });
        return n4.node ? (n4.error && this.setLookaheadState(n4.failState), n4.node) : (n4.error && this.setOptionalParametersError(e4, n4.error), a2);
      }, A2.parseParenItem = function(e4) {
        var s4 = this.start, i3 = this.startLoc;
        if (e4 = t2.prototype.parseParenItem.call(this, e4), this.eat(p2.question) && (e4.optional = true, this.resetEndLocation(e4)), this.match(p2.colon)) {
          var r2 = this.startNodeAt(s4, i3);
          return r2.expression = e4, r2.typeAnnotation = this.tsParseTypeAnnotation(), this.finishNode(r2, "TSTypeCastExpression");
        }
        return e4;
      }, A2.parseExportDeclaration = function(t3) {
        var e4 = this;
        if (!this.isAmbientContext && this.ts_isContextual(_.declare)) return this.tsInAmbientContext(function() {
          return e4.parseExportDeclaration(t3);
        });
        var s4 = this.start, i3 = this.startLoc, r2 = this.eatContextual("declare");
        !r2 || !this.ts_isContextual(_.declare) && this.shouldParseExportStatement() || this.raise(this.start, b.ExpectedAmbientAfterExportDeclare);
        var a2 = q(this.type) && this.tsTryParseExportDeclaration() || this.parseStatement(null);
        return a2 ? (("TSInterfaceDeclaration" === a2.type || "TSTypeAliasDeclaration" === a2.type || r2) && (t3.exportKind = "type"), r2 && (this.resetStartLocation(a2, s4, i3), a2.declare = true), a2) : null;
      }, A2.parseClassId = function(e4, s4) {
        if (s4 || !this.isContextual("implements")) {
          t2.prototype.parseClassId.call(this, e4, s4);
          var i3 = this.tsTryParseTypeParameters(this.tsParseInOutModifiers.bind(this));
          i3 && (e4.typeParameters = i3);
        }
      }, A2.parseClassPropertyAnnotation = function(t3) {
        t3.optional || ("!" === this.value && this.eat(p2.prefix) ? t3.definite = true : this.eat(p2.question) && (t3.optional = true));
        var e4 = this.tsTryParseTypeAnnotation();
        e4 && (t3.typeAnnotation = e4);
      }, A2.parseClassField = function(e4) {
        if ("PrivateIdentifier" === e4.key.type) e4.abstract && this.raise(e4.start, b.PrivateElementHasAbstract), e4.accessibility && this.raise(e4.start, b.PrivateElementHasAccessibility({ modifier: e4.accessibility })), this.parseClassPropertyAnnotation(e4);
        else if (this.parseClassPropertyAnnotation(e4), this.isAmbientContext && (!e4.readonly || e4.typeAnnotation) && this.match(p2.eq) && this.raise(this.start, b.DeclareClassFieldHasInitializer), e4.abstract && this.match(p2.eq)) {
          var s4 = e4.key;
          this.raise(this.start, b.AbstractPropertyHasInitializer({ propertyName: "Identifier" !== s4.type || e4.computed ? "[" + this.input.slice(s4.start, s4.end) + "]" : s4.name }));
        }
        return t2.prototype.parseClassField.call(this, e4);
      }, A2.parseClassMethod = function(t3, e4, s4, i3) {
        var r2 = "constructor" === t3.kind, a2 = "PrivateIdentifier" === t3.key.type, n4 = this.tsTryParseTypeParameters();
        a2 ? (n4 && (t3.typeParameters = n4), t3.accessibility && this.raise(t3.start, b.PrivateMethodsHasAccessibility({ modifier: t3.accessibility }))) : n4 && r2 && this.raise(n4.start, b.ConstructorHasTypeParameters);
        var o2 = t3.declare, h3 = t3.kind;
        !(void 0 !== o2 && o2) || "get" !== h3 && "set" !== h3 || this.raise(t3.start, b.DeclareAccessor({ kind: h3 })), n4 && (t3.typeParameters = n4);
        var p3 = t3.key;
        "constructor" === t3.kind ? (e4 && this.raise(p3.start, "Constructor can't be a generator"), s4 && this.raise(p3.start, "Constructor can't be an async method")) : t3.static && P(t3, "prototype") && this.raise(p3.start, "Classes may not have a static property named prototype");
        var c2 = t3.value = this.parseMethod(e4, s4, i3, true, t3);
        return "get" === t3.kind && 0 !== c2.params.length && this.raiseRecoverable(c2.start, "getter should have no params"), "set" === t3.kind && 1 !== c2.params.length && this.raiseRecoverable(c2.start, "setter should have exactly one param"), "set" === t3.kind && "RestElement" === c2.params[0].type && this.raiseRecoverable(c2.params[0].start, "Setter cannot use rest params"), this.finishNode(t3, "MethodDefinition");
      }, A2.isClassMethod = function() {
        return this.match(p2.relational);
      }, A2.parseClassElement = function(e4) {
        var s4 = this;
        if (this.eat(p2.semi)) return null;
        var i3, r2 = this.options.ecmaVersion, a2 = this.startNode(), n4 = "", o2 = false, h3 = false, c2 = "method", l3 = ["declare", "private", "public", "protected", "accessor", "override", "abstract", "readonly", "static"], u3 = this.tsParseModifiers({ modified: a2, allowedModifiers: l3, disallowedModifiers: ["in", "out"], stopOnStartOfClassStaticBlock: true, errorTemplate: b.InvalidModifierOnTypeParameterPositions });
        i3 = Boolean(u3.static);
        var d3 = function() {
          if (!s4.tsIsStartOfStaticBlocks()) {
            var u4 = s4.tsTryParseIndexSignature(a2);
            if (u4) return a2.abstract && s4.raise(a2.start, b.IndexSignatureHasAbstract), a2.accessibility && s4.raise(a2.start, b.IndexSignatureHasAccessibility({ modifier: a2.accessibility })), a2.declare && s4.raise(a2.start, b.IndexSignatureHasDeclare), a2.override && s4.raise(a2.start, b.IndexSignatureHasOverride), u4;
            if (!s4.inAbstractClass && a2.abstract && s4.raise(a2.start, b.NonAbstractClassHasAbstractMethod), a2.override && e4 && s4.raise(a2.start, b.OverrideNotInSubClass), a2.static = i3, i3 && (s4.isClassElementNameStart() || s4.type === p2.star || (n4 = "static")), !n4 && r2 >= 8 && s4.eatContextual("async") && (!s4.isClassElementNameStart() && s4.type !== p2.star || s4.canInsertSemicolon() ? n4 = "async" : h3 = true), !n4 && (r2 >= 9 || !h3) && s4.eat(p2.star) && (o2 = true), !n4 && !h3 && !o2) {
              var d4 = s4.value;
              (s4.eatContextual("get") || s4.eatContextual("set")) && (s4.isClassElementNameStart() ? c2 = d4 : n4 = d4);
            }
            if (n4 ? (a2.computed = false, a2.key = s4.startNodeAt(s4.lastTokStart, s4.lastTokStartLoc), a2.key.name = n4, s4.finishNode(a2.key, "Identifier")) : s4.parseClassElementName(a2), s4.parsePostMemberNameModifiers(a2), s4.isClassMethod() || r2 < 13 || s4.type === p2.parenL || "method" !== c2 || o2 || h3) {
              var m3 = !a2.static && P(a2, "constructor"), f2 = m3 && e4;
              m3 && "method" !== c2 && s4.raise(a2.key.start, "Constructor can't have get/set modifier"), a2.kind = m3 ? "constructor" : c2, s4.parseClassMethod(a2, o2, h3, f2);
            } else s4.parseClassField(a2);
            return a2;
          }
          if (s4.next(), s4.next(), s4.tsHasSomeModifiers(a2, l3) && s4.raise(s4.start, b.StaticBlockCannotHaveModifier), r2 >= 13) return t2.prototype.parseClassStaticBlock.call(s4, a2), a2;
        };
        return a2.declare ? this.tsInAmbientContext(d3) : d3(), a2;
      }, A2.isClassElementNameStart = function() {
        return !!this.tsIsIdentifier() || t2.prototype.isClassElementNameStart.call(this);
      }, A2.parseClassSuper = function(e4) {
        t2.prototype.parseClassSuper.call(this, e4), e4.superClass && (this.tsMatchLeftRelational() || this.match(p2.bitShift)) && (e4.superTypeParameters = this.tsParseTypeArgumentsInExpression()), this.eatContextual("implements") && (e4.implements = this.tsParseHeritageClause("implements"));
      }, A2.parseFunctionParams = function(e4) {
        var s4 = this.tsTryParseTypeParameters();
        s4 && (e4.typeParameters = s4), t2.prototype.parseFunctionParams.call(this, e4);
      }, A2.parseVarId = function(e4, s4) {
        t2.prototype.parseVarId.call(this, e4, s4), "Identifier" === e4.id.type && !this.hasPrecedingLineBreak() && "!" === this.value && this.eat(p2.prefix) && (e4.definite = true);
        var i3 = this.tsTryParseTypeAnnotation();
        i3 && (e4.id.typeAnnotation = i3, this.resetEndLocation(e4.id));
      }, A2.parseArrowExpression = function(t3, e4, s4, i3) {
        this.match(p2.colon) && (t3.returnType = this.tsParseTypeAnnotation());
        var r2 = this.yieldPos, a2 = this.awaitPos, n4 = this.awaitIdentPos;
        this.enterScope(16 | w(s4, false)), this.initFunction(t3);
        var o2 = this.maybeInArrowParameters;
        return this.options.ecmaVersion >= 8 && (t3.async = !!s4), this.yieldPos = 0, this.awaitPos = 0, this.awaitIdentPos = 0, this.maybeInArrowParameters = true, t3.params = this.toAssignableList(e4, true), this.maybeInArrowParameters = false, this.parseFunctionBody(t3, true, false, i3), this.yieldPos = r2, this.awaitPos = a2, this.awaitIdentPos = n4, this.maybeInArrowParameters = o2, this.finishNode(t3, "ArrowFunctionExpression");
      }, A2.parseMaybeAssignOrigin = function(t3, e4, s4) {
        if (this.isContextual("yield")) {
          if (this.inGenerator) return this.parseYield(t3);
          this.exprAllowed = false;
        }
        var i3 = false, r2 = -1, a2 = -1, n4 = -1;
        e4 ? (r2 = e4.parenthesizedAssign, a2 = e4.trailingComma, n4 = e4.doubleProto, e4.parenthesizedAssign = e4.trailingComma = -1) : (e4 = new T(), i3 = true);
        var o2 = this.start, h3 = this.startLoc;
        (this.type === p2.parenL || q(this.type)) && (this.potentialArrowAt = this.start, this.potentialArrowInForAwait = "await" === t3);
        var c2 = this.parseMaybeConditional(t3, e4);
        if (s4 && (c2 = s4.call(this, c2, o2, h3)), this.type.isAssign) {
          var l3 = this.startNodeAt(o2, h3);
          return l3.operator = this.value, this.type === p2.eq && (c2 = this.toAssignable(c2, true, e4)), i3 || (e4.parenthesizedAssign = e4.trailingComma = e4.doubleProto = -1), e4.shorthandAssign >= c2.start && (e4.shorthandAssign = -1), this.type === p2.eq ? this.checkLValPattern(c2) : this.checkLValSimple(c2), l3.left = c2, this.next(), l3.right = this.parseMaybeAssign(t3), n4 > -1 && (e4.doubleProto = n4), this.finishNode(l3, "AssignmentExpression");
        }
        return i3 && this.checkExpressionErrors(e4, true), r2 > -1 && (e4.parenthesizedAssign = r2), a2 > -1 && (e4.trailingComma = a2), c2;
      }, A2.parseMaybeAssign = function(t3, e4, s4) {
        var i3, r2, a2, o2, h3, p3, c2, l3, u3, d3, m3, f2 = this;
        if (this.matchJsx("jsxTagStart") || this.tsMatchLeftRelational()) {
          if (l3 = this.cloneCurLookaheadState(), !(u3 = this.tryParse(function() {
            return f2.parseMaybeAssignOrigin(t3, e4, s4);
          }, l3)).error) return u3.node;
          var y3 = this.context, x2 = y3[y3.length - 1];
          x2 === n3.tokContexts.tc_oTag && y3[y3.length - 2] === n3.tokContexts.tc_expr ? (y3.pop(), y3.pop()) : x2 !== n3.tokContexts.tc_oTag && x2 !== n3.tokContexts.tc_expr || y3.pop();
        }
        if (!(null != (i3 = u3) && i3.error || this.tsMatchLeftRelational())) return this.parseMaybeAssignOrigin(t3, e4, s4);
        l3 && !this.compareLookaheadState(l3, this.getCurLookaheadState()) || (l3 = this.cloneCurLookaheadState());
        var T2 = this.tryParse(function(i4) {
          var r3, a3;
          m3 = f2.tsParseTypeParameters();
          var n4 = f2.parseMaybeAssignOrigin(t3, e4, s4);
          return ("ArrowFunctionExpression" !== n4.type || null != (r3 = n4.extra) && r3.parenthesized) && i4(), 0 !== (null == (a3 = m3) ? void 0 : a3.params.length) && f2.resetStartLocationFromNode(n4, m3), n4.typeParameters = m3, n4;
        }, l3);
        if (!T2.error && !T2.aborted) return m3 && this.reportReservedArrowTypeParam(m3), T2.node;
        if (!u3 && (k$2(true), !(d3 = this.tryParse(function() {
          return f2.parseMaybeAssignOrigin(t3, e4, s4);
        }, l3)).error)) return d3.node;
        if (null != (r2 = u3) && r2.node) return this.setLookaheadState(u3.failState), u3.node;
        if (T2.node) return this.setLookaheadState(T2.failState), m3 && this.reportReservedArrowTypeParam(m3), T2.node;
        if (null != (a2 = d3) && a2.node) return this.setLookaheadState(d3.failState), d3.node;
        if (null != (o2 = u3) && o2.thrown) throw u3.error;
        if (T2.thrown) throw T2.error;
        if (null != (h3 = d3) && h3.thrown) throw d3.error;
        throw (null == (p3 = u3) ? void 0 : p3.error) || T2.error || (null == (c2 = d3) ? void 0 : c2.error);
      }, A2.parseAssignableListItem = function(t3) {
        for (var e4 = []; this.match(_.at); ) e4.push(this.parseDecorator());
        var s4, i3 = this.start, r2 = this.startLoc, a2 = false, n4 = false;
        if (void 0 !== t3) {
          var o2 = {};
          this.tsParseModifiers({ modified: o2, allowedModifiers: ["public", "private", "protected", "override", "readonly"] }), s4 = o2.accessibility, n4 = o2.override, a2 = o2.readonly, false === t3 && (s4 || a2 || n4) && this.raise(r2.start, b.UnexpectedParameterModifier);
        }
        var h3 = this.parseMaybeDefault(i3, r2);
        this.parseBindingListItem(h3);
        var p3 = this.parseMaybeDefault(h3.start, h3.loc, h3);
        if (e4.length && (p3.decorators = e4), s4 || a2 || n4) {
          var c2 = this.startNodeAt(i3, r2);
          return s4 && (c2.accessibility = s4), a2 && (c2.readonly = a2), n4 && (c2.override = n4), "Identifier" !== p3.type && "AssignmentPattern" !== p3.type && this.raise(c2.start, b.UnsupportedParameterPropertyKind), c2.parameter = p3, this.finishNode(c2, "TSParameterProperty");
        }
        return p3;
      }, A2.checkLValInnerPattern = function(e4, s4, i3) {
        void 0 === s4 && (s4 = 0), "TSParameterProperty" === e4.type ? this.checkLValInnerPattern(e4.parameter, s4, i3) : t2.prototype.checkLValInnerPattern.call(this, e4, s4, i3);
      }, A2.parseBindingListItem = function(t3) {
        this.eat(p2.question) && ("Identifier" === t3.type || this.isAmbientContext || this.inType || this.raise(t3.start, b.PatternIsOptional), t3.optional = true);
        var e4 = this.tsTryParseTypeAnnotation();
        return e4 && (t3.typeAnnotation = e4), this.resetEndLocation(t3), t3;
      }, A2.isAssignable = function(t3, e4) {
        var s4 = this;
        switch (t3.type) {
          case "TSTypeCastExpression":
            return this.isAssignable(t3.expression, e4);
          case "TSParameterProperty":
          case "Identifier":
          case "ObjectPattern":
          case "ArrayPattern":
          case "AssignmentPattern":
          case "RestElement":
            return true;
          case "ObjectExpression":
            var i3 = t3.properties.length - 1;
            return t3.properties.every(function(t4, e5) {
              return "ObjectMethod" !== t4.type && (e5 === i3 || "SpreadElement" !== t4.type) && s4.isAssignable(t4);
            });
          case "Property":
          case "ObjectProperty":
            return this.isAssignable(t3.value);
          case "SpreadElement":
            return this.isAssignable(t3.argument);
          case "ArrayExpression":
            return t3.elements.every(function(t4) {
              return null === t4 || s4.isAssignable(t4);
            });
          case "AssignmentExpression":
            return "=" === t3.operator;
          case "ParenthesizedExpression":
            return this.isAssignable(t3.expression);
          case "MemberExpression":
          case "OptionalMemberExpression":
            return !e4;
          default:
            return false;
        }
      }, A2.toAssignable = function(e4, s4, i3) {
        switch (void 0 === s4 && (s4 = false), void 0 === i3 && (i3 = new T()), e4.type) {
          case "ParenthesizedExpression":
            return this.toAssignableParenthesizedExpression(e4, s4, i3);
          case "TSAsExpression":
          case "TSSatisfiesExpression":
          case "TSNonNullExpression":
          case "TSTypeAssertion":
            return s4 || this.raise(e4.start, b.UnexpectedTypeCastInParameter), this.toAssignable(e4.expression, s4, i3);
          case "MemberExpression":
            break;
          case "AssignmentExpression":
            return s4 || "TSTypeCastExpression" !== e4.left.type || (e4.left = this.typeCastToParameter(e4.left)), t2.prototype.toAssignable.call(this, e4, s4, i3);
          case "TSTypeCastExpression":
            return this.typeCastToParameter(e4);
          default:
            return t2.prototype.toAssignable.call(this, e4, s4, i3);
        }
        return e4;
      }, A2.toAssignableParenthesizedExpression = function(e4, s4, i3) {
        switch (e4.expression.type) {
          case "TSAsExpression":
          case "TSSatisfiesExpression":
          case "TSNonNullExpression":
          case "TSTypeAssertion":
          case "ParenthesizedExpression":
            return this.toAssignable(e4.expression, s4, i3);
          default:
            return t2.prototype.toAssignable.call(this, e4, s4, i3);
        }
      }, A2.curPosition = function() {
        if (this.options.locations) {
          var e4 = t2.prototype.curPosition.call(this);
          return Object.defineProperty(e4, "offset", { get: function() {
            return function(t3) {
              var e5 = new i2.Position(this.line, this.column + t3);
              return e5.index = this.index + t3, e5;
            };
          } }), e4.index = this.pos, e4;
        }
      }, A2.parseBindingAtom = function() {
        return this.type === p2._this ? this.parseIdent(true) : t2.prototype.parseBindingAtom.call(this);
      }, A2.shouldParseArrow = function(t3) {
        var e4, s4 = this;
        if (e4 = this.match(p2.colon) ? t3.every(function(t4) {
          return s4.isAssignable(t4, true);
        }) : !this.canInsertSemicolon()) {
          if (this.match(p2.colon)) {
            var i3 = this.tryParse(function(t4) {
              var e5 = s4.tsParseTypeOrTypePredicateAnnotation(p2.colon);
              return !s4.canInsertSemicolon() && s4.match(p2.arrow) || t4(), e5;
            });
            if (i3.aborted) return this.shouldParseArrowReturnType = void 0, false;
            i3.thrown || (i3.error && this.setLookaheadState(i3.failState), this.shouldParseArrowReturnType = i3.node);
          }
          return !!this.match(p2.arrow) || (this.shouldParseArrowReturnType = void 0, false);
        }
        return this.shouldParseArrowReturnType = void 0, e4;
      }, A2.parseParenArrowList = function(t3, e4, s4, i3) {
        var r2 = this.startNodeAt(t3, e4);
        return r2.returnType = this.shouldParseArrowReturnType, this.shouldParseArrowReturnType = void 0, this.parseArrowExpression(r2, s4, false, i3);
      }, A2.parseParenAndDistinguishExpression = function(t3, e4) {
        var s4, i3 = this.start, r2 = this.startLoc, a2 = this.options.ecmaVersion >= 8;
        if (this.options.ecmaVersion >= 6) {
          var n4 = this.maybeInArrowParameters;
          this.maybeInArrowParameters = true, this.next();
          var o2, h3 = this.start, c2 = this.startLoc, l3 = [], u3 = true, d3 = false, m3 = new T(), f2 = this.yieldPos, y3 = this.awaitPos;
          for (this.yieldPos = 0, this.awaitPos = 0; this.type !== p2.parenR; ) {
            if (u3 ? u3 = false : this.expect(p2.comma), a2 && this.afterTrailingComma(p2.parenR, true)) {
              d3 = true;
              break;
            }
            if (this.type === p2.ellipsis) {
              o2 = this.start, l3.push(this.parseParenItem(this.parseRestBinding())), this.type === p2.comma && this.raise(this.start, "Comma is not permitted after the rest element");
              break;
            }
            l3.push(this.parseMaybeAssign(e4, m3, this.parseParenItem));
          }
          var x2 = this.lastTokEnd, v2 = this.lastTokEndLoc;
          if (this.expect(p2.parenR), this.maybeInArrowParameters = n4, t3 && this.shouldParseArrow(l3) && this.eat(p2.arrow)) return this.checkPatternErrors(m3, false), this.checkYieldAwaitInDefaultParams(), this.yieldPos = f2, this.awaitPos = y3, this.parseParenArrowList(i3, r2, l3, e4);
          l3.length && !d3 || this.unexpected(this.lastTokStart), o2 && this.unexpected(o2), this.checkExpressionErrors(m3, true), this.yieldPos = f2 || this.yieldPos, this.awaitPos = y3 || this.awaitPos, l3.length > 1 ? ((s4 = this.startNodeAt(h3, c2)).expressions = l3, this.finishNodeAt(s4, "SequenceExpression", x2, v2)) : s4 = l3[0];
        } else s4 = this.parseParenExpression();
        if (this.options.preserveParens) {
          var P2 = this.startNodeAt(i3, r2);
          return P2.expression = s4, this.finishNode(P2, "ParenthesizedExpression");
        }
        return s4;
      }, A2.parseTaggedTemplateExpression = function(t3, e4, s4, i3) {
        var r2 = this.startNodeAt(e4, s4);
        return r2.tag = t3, r2.quasi = this.parseTemplate({ isTagged: true }), i3 && this.raise(e4, "Tagged Template Literals are not allowed in optionalChain."), this.finishNode(r2, "TaggedTemplateExpression");
      }, A2.shouldParseAsyncArrow = function() {
        var t3 = this;
        if (!this.match(p2.colon)) return !this.canInsertSemicolon() && this.eat(p2.arrow);
        var e4 = this.tryParse(function(e5) {
          var s4 = t3.tsParseTypeOrTypePredicateAnnotation(p2.colon);
          return !t3.canInsertSemicolon() && t3.match(p2.arrow) || e5(), s4;
        });
        return e4.aborted ? (this.shouldParseAsyncArrowReturnType = void 0, false) : e4.thrown ? void 0 : (e4.error && this.setLookaheadState(e4.failState), this.shouldParseAsyncArrowReturnType = e4.node, !this.canInsertSemicolon() && this.eat(p2.arrow));
      }, A2.parseSubscriptAsyncArrow = function(t3, e4, s4, i3) {
        var r2 = this.startNodeAt(t3, e4);
        return r2.returnType = this.shouldParseAsyncArrowReturnType, this.shouldParseAsyncArrowReturnType = void 0, this.parseArrowExpression(r2, s4, true, i3);
      }, A2.parseExprList = function(t3, e4, s4, i3) {
        for (var r2 = [], a2 = true; !this.eat(t3); ) {
          if (a2) a2 = false;
          else if (this.expect(p2.comma), e4 && this.afterTrailingComma(t3)) break;
          var n4 = void 0;
          s4 && this.type === p2.comma ? n4 = null : this.type === p2.ellipsis ? (n4 = this.parseSpread(i3), i3 && this.type === p2.comma && i3.trailingComma < 0 && (i3.trailingComma = this.start)) : n4 = this.parseMaybeAssign(false, i3, this.parseParenItem), r2.push(n4);
        }
        return r2;
      }, A2.parseSubscript = function(t3, e4, s4, i3, r2, a2, n4) {
        var o2 = this, h3 = a2;
        if (!this.hasPrecedingLineBreak() && "!" === this.value && this.match(p2.prefix)) {
          this.exprAllowed = false, this.next();
          var c2 = this.startNodeAt(e4, s4);
          return c2.expression = t3, t3 = this.finishNode(c2, "TSNonNullExpression");
        }
        var l3 = false;
        if (this.match(p2.questionDot) && 60 === this.lookaheadCharCode()) {
          if (i3) return t3;
          t3.optional = true, h3 = l3 = true, this.next();
        }
        if (this.tsMatchLeftRelational() || this.match(p2.bitShift)) {
          var u3, d3 = this.tsTryParseAndCatch(function() {
            if (!i3 && o2.atPossibleAsyncArrow(t3)) {
              var r3 = o2.tsTryParseGenericAsyncArrowFunction(e4, s4, n4);
              if (r3) return t3 = r3;
            }
            var a3 = o2.tsParseTypeArgumentsInExpression();
            if (!a3) return t3;
            if (l3 && !o2.match(p2.parenL)) return u3 = o2.curPosition(), t3;
            if (B(o2.type) || o2.type === p2.backQuote) {
              var c3 = o2.parseTaggedTemplateExpression(t3, e4, s4, h3);
              return c3.typeParameters = a3, c3;
            }
            if (!i3 && o2.eat(p2.parenL)) {
              var d4 = new T(), m4 = o2.startNodeAt(e4, s4);
              return m4.callee = t3, m4.arguments = o2.parseExprList(p2.parenR, o2.options.ecmaVersion >= 8, false, d4), o2.tsCheckForInvalidTypeCasts(m4.arguments), m4.typeParameters = a3, h3 && (m4.optional = l3), o2.checkExpressionErrors(d4, true), t3 = o2.finishNode(m4, "CallExpression");
            }
            var f3 = o2.type;
            if (!(o2.tsMatchRightRelational() || f3 === p2.bitShift || f3 !== p2.parenL && (y4 = f3, Boolean(y4.startsExpr)) && !o2.hasPrecedingLineBreak())) {
              var y4, x3 = o2.startNodeAt(e4, s4);
              return x3.expression = t3, x3.typeParameters = a3, o2.finishNode(x3, "TSInstantiationExpression");
            }
          });
          if (u3 && this.unexpected(u3), d3) return "TSInstantiationExpression" === d3.type && (this.match(p2.dot) || this.match(p2.questionDot) && 40 !== this.lookaheadCharCode()) && this.raise(this.start, b.InvalidPropertyAccessAfterInstantiationExpression), t3 = d3;
        }
        var m3 = this.options.ecmaVersion >= 11, f2 = m3 && this.eat(p2.questionDot);
        i3 && f2 && this.raise(this.lastTokStart, "Optional chaining cannot appear in the callee of new expressions");
        var y3 = this.eat(p2.bracketL);
        if (y3 || f2 && this.type !== p2.parenL && this.type !== p2.backQuote || this.eat(p2.dot)) {
          var x2 = this.startNodeAt(e4, s4);
          x2.object = t3, y3 ? (x2.property = this.parseExpression(), this.expect(p2.bracketR)) : x2.property = this.type === p2.privateId && "Super" !== t3.type ? this.parsePrivateIdent() : this.parseIdent("never" !== this.options.allowReserved), x2.computed = !!y3, m3 && (x2.optional = f2), t3 = this.finishNode(x2, "MemberExpression");
        } else if (!i3 && this.eat(p2.parenL)) {
          var v2 = this.maybeInArrowParameters;
          this.maybeInArrowParameters = true;
          var P2 = new T(), g3 = this.yieldPos, A3 = this.awaitPos, S2 = this.awaitIdentPos;
          this.yieldPos = 0, this.awaitPos = 0, this.awaitIdentPos = 0;
          var C2 = this.parseExprList(p2.parenR, this.options.ecmaVersion >= 8, false, P2);
          if (r2 && !f2 && this.shouldParseAsyncArrow()) this.checkPatternErrors(P2, false), this.checkYieldAwaitInDefaultParams(), this.awaitIdentPos > 0 && this.raise(this.awaitIdentPos, "Cannot use 'await' as identifier inside an async function"), this.yieldPos = g3, this.awaitPos = A3, this.awaitIdentPos = S2, t3 = this.parseSubscriptAsyncArrow(e4, s4, C2, n4);
          else {
            this.checkExpressionErrors(P2, true), this.yieldPos = g3 || this.yieldPos, this.awaitPos = A3 || this.awaitPos, this.awaitIdentPos = S2 || this.awaitIdentPos;
            var E2 = this.startNodeAt(e4, s4);
            E2.callee = t3, E2.arguments = C2, m3 && (E2.optional = f2), t3 = this.finishNode(E2, "CallExpression");
          }
          this.maybeInArrowParameters = v2;
        } else if (this.type === p2.backQuote) {
          (f2 || h3) && this.raise(this.start, "Optional chaining cannot appear in the tag of tagged template expressions");
          var k = this.startNodeAt(e4, s4);
          k.tag = t3, k.quasi = this.parseTemplate({ isTagged: true }), t3 = this.finishNode(k, "TaggedTemplateExpression");
        }
        return t3;
      }, A2.parseGetterSetter = function(t3) {
        t3.kind = t3.key.name, this.parsePropertyName(t3), t3.value = this.parseMethod(false);
        var e4 = "get" === t3.kind ? 0 : 1, s4 = t3.value.params[0], i3 = s4 && this.isThisParam(s4);
        t3.value.params.length !== (e4 = i3 ? e4 + 1 : e4) ? this.raiseRecoverable(t3.value.start, "get" === t3.kind ? "getter should have no params" : "setter should have exactly one param") : "set" === t3.kind && "RestElement" === t3.value.params[0].type && this.raiseRecoverable(t3.value.params[0].start, "Setter cannot use rest params");
      }, A2.parseProperty = function(e4, s4) {
        if (!e4) {
          var i3 = [];
          if (this.match(_.at)) for (; this.match(_.at); ) i3.push(this.parseDecorator());
          var r2 = t2.prototype.parseProperty.call(this, e4, s4);
          return "SpreadElement" === r2.type && i3.length && this.raise(r2.start, "Decorators can't be used with SpreadElement"), i3.length && (r2.decorators = i3, i3 = []), r2;
        }
        return t2.prototype.parseProperty.call(this, e4, s4);
      }, A2.parseCatchClauseParam = function() {
        var t3 = this.parseBindingAtom(), e4 = "Identifier" === t3.type;
        this.enterScope(e4 ? 32 : 0), this.checkLValPattern(t3, e4 ? 4 : 2);
        var s4 = this.tsTryParseTypeAnnotation();
        return s4 && (t3.typeAnnotation = s4, this.resetEndLocation(t3)), this.expect(p2.parenR), t3;
      }, A2.parseClass = function(t3, e4) {
        var s4 = this.inAbstractClass;
        this.inAbstractClass = !!t3.abstract;
        try {
          this.next(), this.takeDecorators(t3);
          var i3 = this.strict;
          this.strict = true, this.parseClassId(t3, e4), this.parseClassSuper(t3);
          var r2 = this.enterClassBody(), a2 = this.startNode(), n4 = false;
          a2.body = [];
          var o2 = [];
          for (this.expect(p2.braceL); this.type !== p2.braceR; ) if (this.match(_.at)) o2.push(this.parseDecorator());
          else {
            var h3 = this.parseClassElement(null !== t3.superClass);
            o2.length && (h3.decorators = o2, this.resetStartLocationFromNode(h3, o2[0]), o2 = []), h3 && (a2.body.push(h3), "MethodDefinition" === h3.type && "constructor" === h3.kind && "FunctionExpression" === h3.value.type ? (n4 && this.raiseRecoverable(h3.start, "Duplicate constructor in the same class"), n4 = true, h3.decorators && h3.decorators.length > 0 && this.raise(h3.start, "Decorators can't be used with a constructor. Did you mean '@dec class { ... }'?")) : h3.key && "PrivateIdentifier" === h3.key.type && v(r2, h3) && this.raiseRecoverable(h3.key.start, "Identifier '#" + h3.key.name + "' has already been declared"));
          }
          return this.strict = i3, this.next(), o2.length && this.raise(this.start, "Decorators must be attached to a class element."), t3.body = this.finishNode(a2, "ClassBody"), this.exitClassBody(), this.finishNode(t3, e4 ? "ClassDeclaration" : "ClassExpression");
        } finally {
          this.inAbstractClass = s4;
        }
      }, A2.parseClassFunctionParams = function() {
        var t3 = this.tsTryParseTypeParameters(this.tsParseConstModifier), e4 = this.parseBindingList(p2.parenR, false, this.options.ecmaVersion >= 8, true);
        return t3 && (e4.typeParameters = t3), e4;
      }, A2.parseMethod = function(t3, e4, s4, i3, r2) {
        var a2 = this.startNode(), n4 = this.yieldPos, o2 = this.awaitPos, h3 = this.awaitIdentPos;
        if (this.initFunction(a2), this.options.ecmaVersion >= 6 && (a2.generator = t3), this.options.ecmaVersion >= 8 && (a2.async = !!e4), this.yieldPos = 0, this.awaitPos = 0, this.awaitIdentPos = 0, this.enterScope(64 | w(e4, a2.generator) | (s4 ? 128 : 0)), this.expect(p2.parenL), a2.params = this.parseClassFunctionParams(), this.checkYieldAwaitInDefaultParams(), this.parseFunctionBody(a2, false, true, false, { isClassMethod: i3 }), this.yieldPos = n4, this.awaitPos = o2, this.awaitIdentPos = h3, r2 && r2.abstract && a2.body) {
          var c2 = r2.key;
          this.raise(r2.start, b.AbstractMethodHasImplementation({ methodName: "Identifier" !== c2.type || r2.computed ? "[" + this.input.slice(c2.start, c2.end) + "]" : c2.name }));
        }
        return this.finishNode(a2, "FunctionExpression");
      }, e3.parse = function(t3, e4) {
        if (false === e4.locations) throw new Error("You have to enable options.locations while using acorn-typescript");
        e4.locations = true;
        var s4 = new this(e4, t3);
        return r && (s4.isAmbientContext = true), s4.parse();
      }, e3.parseExpressionAt = function(t3, e4, s4) {
        if (false === s4.locations) throw new Error("You have to enable options.locations while using acorn-typescript");
        s4.locations = true;
        var i3 = new this(s4, t3, e4);
        return r && (i3.isAmbientContext = true), i3.nextToken(), i3.parseExpression();
      }, A2.parseImportSpecifier = function() {
        if (this.ts_isContextual(_.type)) {
          var e4 = this.startNode();
          return e4.imported = this.parseModuleExportName(), this.parseTypeOnlyImportExportSpecifier(e4, true, "type" === this.importOrExportOuterKind), this.finishNode(e4, "ImportSpecifier");
        }
        var s4 = t2.prototype.parseImportSpecifier.call(this);
        return s4.importKind = "value", s4;
      }, A2.parseExportSpecifier = function(e4) {
        var s4 = this.ts_isContextual(_.type);
        if (!this.match(p2.string) && s4) {
          var i3 = this.startNode();
          return i3.local = this.parseModuleExportName(), this.parseTypeOnlyImportExportSpecifier(i3, false, "type" === this.importOrExportOuterKind), this.finishNode(i3, "ExportSpecifier"), this.checkExport(e4, i3.exported, i3.exported.start), i3;
        }
        var r2 = t2.prototype.parseExportSpecifier.call(this, e4);
        return r2.exportKind = "value", r2;
      }, A2.parseTypeOnlyImportExportSpecifier = function(e4, s4, i3) {
        var r2, a2 = s4 ? "imported" : "local", n4 = s4 ? "local" : "exported", o2 = e4[a2], h3 = false, p3 = true, c2 = o2.start;
        if (this.isContextual("as")) {
          var l3 = this.parseIdent();
          if (this.isContextual("as")) {
            var u3 = this.parseIdent();
            U(this.type) ? (h3 = true, o2 = l3, r2 = s4 ? this.parseIdent() : this.parseModuleExportName(), p3 = false) : (r2 = u3, p3 = false);
          } else U(this.type) ? (p3 = false, r2 = s4 ? this.parseIdent() : this.parseModuleExportName()) : (h3 = true, o2 = l3);
        } else U(this.type) && (h3 = true, s4 ? (o2 = t2.prototype.parseIdent.call(this, true), this.isContextual("as") || this.checkUnreserved(o2)) : o2 = this.parseModuleExportName());
        h3 && i3 && this.raise(c2, s4 ? b.TypeModifierIsUsedInTypeImports : b.TypeModifierIsUsedInTypeExports), e4[a2] = o2, e4[n4] = r2, e4[s4 ? "importKind" : "exportKind"] = h3 ? "type" : "value", p3 && this.eatContextual("as") && (e4[n4] = s4 ? this.parseIdent() : this.parseModuleExportName()), e4[n4] || (e4[n4] = this.copyNode(e4[a2])), s4 && this.checkLValSimple(e4[n4], 2);
      }, A2.raiseCommonCheck = function(e4, s4, i3) {
        return "Comma is not permitted after the rest element" === s4 ? this.isAmbientContext && this.match(p2.comma) && 41 === this.lookaheadCharCode() ? void this.next() : t2.prototype.raise.call(this, e4, s4) : i3 ? t2.prototype.raiseRecoverable.call(this, e4, s4) : t2.prototype.raise.call(this, e4, s4);
      }, A2.raiseRecoverable = function(t3, e4) {
        return this.raiseCommonCheck(t3, e4, true);
      }, A2.raise = function(t3, e4) {
        return this.raiseCommonCheck(t3, e4, true);
      }, A2.updateContext = function(e4) {
        var s4 = this.type;
        if (s4 == p2.braceL) {
          var i3 = this.curContext();
          i3 == R.tc_oTag ? this.context.push(M2.b_expr) : i3 == R.tc_expr ? this.context.push(M2.b_tmpl) : t2.prototype.updateContext.call(this, e4), this.exprAllowed = true;
        } else {
          if (s4 !== p2.slash || e4 !== _.jsxTagStart) return t2.prototype.updateContext.call(this, e4);
          this.context.length -= 2, this.context.push(R.tc_cTag), this.exprAllowed = false;
        }
      }, A2.jsx_parseOpeningElementAt = function(t3, e4) {
        var s4 = this, i3 = this.startNodeAt(t3, e4), r2 = this.jsx_parseElementName();
        if (r2 && (i3.name = r2), this.match(p2.relational) || this.match(p2.bitShift)) {
          var a2 = this.tsTryParseAndCatch(function() {
            return s4.tsParseTypeArgumentsInExpression();
          });
          a2 && (i3.typeParameters = a2);
        }
        for (i3.attributes = []; this.type !== p2.slash && this.type !== _.jsxTagEnd; ) i3.attributes.push(this.jsx_parseAttribute());
        return i3.selfClosing = this.eat(p2.slash), this.expect(_.jsxTagEnd), this.finishNode(i3, r2 ? "JSXOpeningElement" : "JSXOpeningFragment");
      }, A2.enterScope = function(e4) {
        e4 === f && this.importsStack.push([]), t2.prototype.enterScope.call(this, e4);
        var s4 = t2.prototype.currentScope.call(this);
        s4.types = [], s4.enums = [], s4.constEnums = [], s4.classes = [], s4.exportOnlyBindings = [];
      }, A2.exitScope = function() {
        t2.prototype.currentScope.call(this).flags === f && this.importsStack.pop(), t2.prototype.exitScope.call(this);
      }, A2.hasImport = function(t3, e4) {
        var s4 = this.importsStack.length;
        if (this.importsStack[s4 - 1].indexOf(t3) > -1) return true;
        if (!e4 && s4 > 1) {
          for (var i3 = 0; i3 < s4 - 1; i3++) if (this.importsStack[i3].indexOf(t3) > -1) return true;
        }
        return false;
      }, A2.maybeExportDefined = function(t3, e4) {
        this.inModule && 1 & t3.flags && this.undefinedExports.delete(e4);
      }, A2.isRedeclaredInScope = function(e4, s4, i3) {
        return !!(0 & i3) && (2 & i3 ? e4.lexical.indexOf(s4) > -1 || e4.functions.indexOf(s4) > -1 || e4.var.indexOf(s4) > -1 : 3 & i3 ? e4.lexical.indexOf(s4) > -1 || !t2.prototype.treatFunctionsAsVarInScope.call(this, e4) && e4.var.indexOf(s4) > -1 : e4.lexical.indexOf(s4) > -1 && !(32 & e4.flags && e4.lexical[0] === s4) || !this.treatFunctionsAsVarInScope(e4) && e4.functions.indexOf(s4) > -1);
      }, A2.checkRedeclarationInScope = function(t3, e4, s4, i3) {
        this.isRedeclaredInScope(t3, e4, s4) && this.raise(i3, "Identifier '" + e4 + "' has already been declared.");
      }, A2.declareName = function(e4, s4, i3) {
        if (4096 & s4) return this.hasImport(e4, true) && this.raise(i3, "Identifier '" + e4 + "' has already been declared."), void this.importsStack[this.importsStack.length - 1].push(e4);
        var r2 = this.currentScope();
        if (1024 & s4) return this.maybeExportDefined(r2, e4), void r2.exportOnlyBindings.push(e4);
        t2.prototype.declareName.call(this, e4, s4, i3), 0 & s4 && (0 & s4 || (this.checkRedeclarationInScope(r2, e4, s4, i3), this.maybeExportDefined(r2, e4)), r2.types.push(e4)), 256 & s4 && r2.enums.push(e4), 512 & s4 && r2.constEnums.push(e4), 128 & s4 && r2.classes.push(e4);
      }, A2.checkLocalExport = function(e4) {
        var s4 = e4.name;
        if (!this.hasImport(s4)) {
          for (var i3 = this.scopeStack.length - 1; i3 >= 0; i3--) {
            var r2 = this.scopeStack[i3];
            if (r2.types.indexOf(s4) > -1 || r2.exportOnlyBindings.indexOf(s4) > -1) return;
          }
          t2.prototype.checkLocalExport.call(this, e4);
        }
      }, s3 = e3, g2 = [{ key: "acornTypeScript", get: function() {
        return n3;
      } }], (m2 = [{ key: "acornTypeScript", get: function() {
        return n3;
      } }]) && a(s3.prototype, m2), g2 && a(s3, g2), Object.defineProperty(s3, "prototype", { writable: false }), e3;
    }(s2);
    return z;
  };
}
Parser.extend(D({ allowSatisfies: true }));
function is_capture_event(name) {
  return name.endsWith("capture") && name !== "gotpointercapture" && name !== "lostpointercapture";
}
const DELEGATED_EVENTS = [
  "beforeinput",
  "click",
  "change",
  "dblclick",
  "contextmenu",
  "focusin",
  "focusout",
  "input",
  "keydown",
  "keyup",
  "mousedown",
  "mousemove",
  "mouseout",
  "mouseover",
  "mouseup",
  "pointerdown",
  "pointermove",
  "pointerout",
  "pointerover",
  "pointerup",
  "touchend",
  "touchmove",
  "touchstart"
];
function is_delegated(event_name) {
  return DELEGATED_EVENTS.includes(event_name);
}
const ATTRIBUTE_ALIASES = {
  // no `class: 'className'` because we handle that separately
  formnovalidate: "formNoValidate",
  ismap: "isMap",
  nomodule: "noModule",
  playsinline: "playsInline",
  readonly: "readOnly"
};
function normalize_attribute(name) {
  name = name.toLowerCase();
  return ATTRIBUTE_ALIASES[name] ?? name;
}
const PASSIVE_EVENTS = ["touchstart", "touchmove"];
function is_passive_event(name) {
  return PASSIVE_EVENTS.includes(name);
}
class InternalCompileError extends CompileDiagnostic {
  /**
   * @param {string} code
   * @param {string} message
   * @param {[number, number] | undefined} position
   */
  constructor(code, message, position) {
    super(code, message, position);
    __publicField(this, "name", "CompileError");
  }
}
function e(node, code, message) {
  throw new InternalCompileError(code, message, void 0);
}
function options_invalid_value(node, details) {
  e(node, "options_invalid_value", `Invalid compiler option: ${details}`);
}
function options_removed(node, details) {
  e(node, "options_removed", `Invalid compiler option: ${details}`);
}
function options_unrecognised(node, keypath) {
  e(node, "options_unrecognised", `Unrecognised compiler option ${keypath}`);
}
const entities = {
  "CounterClockwiseContourIntegral;": 8755,
  "ClockwiseContourIntegral;": 8754,
  "DoubleLongLeftRightArrow;": 10234,
  "NotNestedGreaterGreater;": 10914,
  "DiacriticalDoubleAcute;": 733,
  "NotSquareSupersetEqual;": 8931,
  "CloseCurlyDoubleQuote;": 8221,
  "DoubleContourIntegral;": 8751,
  "FilledVerySmallSquare;": 9642,
  "NegativeVeryThinSpace;": 8203,
  "NotPrecedesSlantEqual;": 8928,
  "NotRightTriangleEqual;": 8941,
  "NotSucceedsSlantEqual;": 8929,
  "CapitalDifferentialD;": 8517,
  "DoubleLeftRightArrow;": 8660,
  "DoubleLongRightArrow;": 10233,
  "EmptyVerySmallSquare;": 9643,
  "NestedGreaterGreater;": 8811,
  "NotDoubleVerticalBar;": 8742,
  "NotGreaterSlantEqual;": 10878,
  "NotLeftTriangleEqual;": 8940,
  "NotSquareSubsetEqual;": 8930,
  "OpenCurlyDoubleQuote;": 8220,
  "ReverseUpEquilibrium;": 10607,
  "DoubleLongLeftArrow;": 10232,
  "DownLeftRightVector;": 10576,
  "LeftArrowRightArrow;": 8646,
  "NegativeMediumSpace;": 8203,
  "NotGreaterFullEqual;": 8807,
  "NotRightTriangleBar;": 10704,
  "RightArrowLeftArrow;": 8644,
  "SquareSupersetEqual;": 8850,
  "leftrightsquigarrow;": 8621,
  "DownRightTeeVector;": 10591,
  "DownRightVectorBar;": 10583,
  "LongLeftRightArrow;": 10231,
  "Longleftrightarrow;": 10234,
  "NegativeThickSpace;": 8203,
  "NotLeftTriangleBar;": 10703,
  "PrecedesSlantEqual;": 8828,
  "ReverseEquilibrium;": 8651,
  "RightDoubleBracket;": 10215,
  "RightDownTeeVector;": 10589,
  "RightDownVectorBar;": 10581,
  "RightTriangleEqual;": 8885,
  "SquareIntersection;": 8851,
  "SucceedsSlantEqual;": 8829,
  "blacktriangleright;": 9656,
  "longleftrightarrow;": 10231,
  "DoubleUpDownArrow;": 8661,
  "DoubleVerticalBar;": 8741,
  "DownLeftTeeVector;": 10590,
  "DownLeftVectorBar;": 10582,
  "FilledSmallSquare;": 9724,
  "GreaterSlantEqual;": 10878,
  "LeftDoubleBracket;": 10214,
  "LeftDownTeeVector;": 10593,
  "LeftDownVectorBar;": 10585,
  "LeftTriangleEqual;": 8884,
  "NegativeThinSpace;": 8203,
  "NotGreaterGreater;": 8811,
  "NotLessSlantEqual;": 10877,
  "NotNestedLessLess;": 10913,
  "NotReverseElement;": 8716,
  "NotSquareSuperset;": 8848,
  "NotTildeFullEqual;": 8775,
  "RightAngleBracket;": 10217,
  "RightUpDownVector;": 10575,
  "SquareSubsetEqual;": 8849,
  "VerticalSeparator;": 10072,
  "blacktriangledown;": 9662,
  "blacktriangleleft;": 9666,
  "leftrightharpoons;": 8651,
  "rightleftharpoons;": 8652,
  "twoheadrightarrow;": 8608,
  "DiacriticalAcute;": 180,
  "DiacriticalGrave;": 96,
  "DiacriticalTilde;": 732,
  "DoubleRightArrow;": 8658,
  "DownArrowUpArrow;": 8693,
  "EmptySmallSquare;": 9723,
  "GreaterEqualLess;": 8923,
  "GreaterFullEqual;": 8807,
  "LeftAngleBracket;": 10216,
  "LeftUpDownVector;": 10577,
  "LessEqualGreater;": 8922,
  "NonBreakingSpace;": 160,
  "NotPrecedesEqual;": 10927,
  "NotRightTriangle;": 8939,
  "NotSucceedsEqual;": 10928,
  "NotSucceedsTilde;": 8831,
  "NotSupersetEqual;": 8841,
  "RightTriangleBar;": 10704,
  "RightUpTeeVector;": 10588,
  "RightUpVectorBar;": 10580,
  "UnderParenthesis;": 9181,
  "UpArrowDownArrow;": 8645,
  "circlearrowright;": 8635,
  "downharpoonright;": 8642,
  "ntrianglerighteq;": 8941,
  "rightharpoondown;": 8641,
  "rightrightarrows;": 8649,
  "twoheadleftarrow;": 8606,
  "vartriangleright;": 8883,
  "CloseCurlyQuote;": 8217,
  "ContourIntegral;": 8750,
  "DoubleDownArrow;": 8659,
  "DoubleLeftArrow;": 8656,
  "DownRightVector;": 8641,
  "LeftRightVector;": 10574,
  "LeftTriangleBar;": 10703,
  "LeftUpTeeVector;": 10592,
  "LeftUpVectorBar;": 10584,
  "LowerRightArrow;": 8600,
  "NotGreaterEqual;": 8817,
  "NotGreaterTilde;": 8821,
  "NotHumpDownHump;": 8782,
  "NotLeftTriangle;": 8938,
  "NotSquareSubset;": 8847,
  "OverParenthesis;": 9180,
  "RightDownVector;": 8642,
  "ShortRightArrow;": 8594,
  "UpperRightArrow;": 8599,
  "bigtriangledown;": 9661,
  "circlearrowleft;": 8634,
  "curvearrowright;": 8631,
  "downharpoonleft;": 8643,
  "leftharpoondown;": 8637,
  "leftrightarrows;": 8646,
  "nLeftrightarrow;": 8654,
  "nleftrightarrow;": 8622,
  "ntrianglelefteq;": 8940,
  "rightleftarrows;": 8644,
  "rightsquigarrow;": 8605,
  "rightthreetimes;": 8908,
  "straightepsilon;": 1013,
  "trianglerighteq;": 8885,
  "vartriangleleft;": 8882,
  "DiacriticalDot;": 729,
  "DoubleRightTee;": 8872,
  "DownLeftVector;": 8637,
  "GreaterGreater;": 10914,
  "HorizontalLine;": 9472,
  "InvisibleComma;": 8291,
  "InvisibleTimes;": 8290,
  "LeftDownVector;": 8643,
  "LeftRightArrow;": 8596,
  "Leftrightarrow;": 8660,
  "LessSlantEqual;": 10877,
  "LongRightArrow;": 10230,
  "Longrightarrow;": 10233,
  "LowerLeftArrow;": 8601,
  "NestedLessLess;": 8810,
  "NotGreaterLess;": 8825,
  "NotLessGreater;": 8824,
  "NotSubsetEqual;": 8840,
  "NotVerticalBar;": 8740,
  "OpenCurlyQuote;": 8216,
  "ReverseElement;": 8715,
  "RightTeeVector;": 10587,
  "RightVectorBar;": 10579,
  "ShortDownArrow;": 8595,
  "ShortLeftArrow;": 8592,
  "SquareSuperset;": 8848,
  "TildeFullEqual;": 8773,
  "UpperLeftArrow;": 8598,
  "ZeroWidthSpace;": 8203,
  "curvearrowleft;": 8630,
  "doublebarwedge;": 8966,
  "downdownarrows;": 8650,
  "hookrightarrow;": 8618,
  "leftleftarrows;": 8647,
  "leftrightarrow;": 8596,
  "leftthreetimes;": 8907,
  "longrightarrow;": 10230,
  "looparrowright;": 8620,
  "nshortparallel;": 8742,
  "ntriangleright;": 8939,
  "rightarrowtail;": 8611,
  "rightharpoonup;": 8640,
  "trianglelefteq;": 8884,
  "upharpoonright;": 8638,
  "ApplyFunction;": 8289,
  "DifferentialD;": 8518,
  "DoubleLeftTee;": 10980,
  "DoubleUpArrow;": 8657,
  "LeftTeeVector;": 10586,
  "LeftVectorBar;": 10578,
  "LessFullEqual;": 8806,
  "LongLeftArrow;": 10229,
  "Longleftarrow;": 10232,
  "NotEqualTilde;": 8770,
  "NotTildeEqual;": 8772,
  "NotTildeTilde;": 8777,
  "Poincareplane;": 8460,
  "PrecedesEqual;": 10927,
  "PrecedesTilde;": 8830,
  "RightArrowBar;": 8677,
  "RightTeeArrow;": 8614,
  "RightTriangle;": 8883,
  "RightUpVector;": 8638,
  "SucceedsEqual;": 10928,
  "SucceedsTilde;": 8831,
  "SupersetEqual;": 8839,
  "UpEquilibrium;": 10606,
  "VerticalTilde;": 8768,
  "VeryThinSpace;": 8202,
  "bigtriangleup;": 9651,
  "blacktriangle;": 9652,
  "divideontimes;": 8903,
  "fallingdotseq;": 8786,
  "hookleftarrow;": 8617,
  "leftarrowtail;": 8610,
  "leftharpoonup;": 8636,
  "longleftarrow;": 10229,
  "looparrowleft;": 8619,
  "measuredangle;": 8737,
  "ntriangleleft;": 8938,
  "shortparallel;": 8741,
  "smallsetminus;": 8726,
  "triangleright;": 9657,
  "upharpoonleft;": 8639,
  "varsubsetneqq;": 10955,
  "varsupsetneqq;": 10956,
  "DownArrowBar;": 10515,
  "DownTeeArrow;": 8615,
  "ExponentialE;": 8519,
  "GreaterEqual;": 8805,
  "GreaterTilde;": 8819,
  "HilbertSpace;": 8459,
  "HumpDownHump;": 8782,
  "Intersection;": 8898,
  "LeftArrowBar;": 8676,
  "LeftTeeArrow;": 8612,
  "LeftTriangle;": 8882,
  "LeftUpVector;": 8639,
  "NotCongruent;": 8802,
  "NotHumpEqual;": 8783,
  "NotLessEqual;": 8816,
  "NotLessTilde;": 8820,
  "Proportional;": 8733,
  "RightCeiling;": 8969,
  "RoundImplies;": 10608,
  "ShortUpArrow;": 8593,
  "SquareSubset;": 8847,
  "UnderBracket;": 9141,
  "VerticalLine;": 124,
  "blacklozenge;": 10731,
  "exponentiale;": 8519,
  "risingdotseq;": 8787,
  "triangledown;": 9663,
  "triangleleft;": 9667,
  "varsubsetneq;": 8842,
  "varsupsetneq;": 8843,
  "CircleMinus;": 8854,
  "CircleTimes;": 8855,
  "Equilibrium;": 8652,
  "GreaterLess;": 8823,
  "LeftCeiling;": 8968,
  "LessGreater;": 8822,
  "MediumSpace;": 8287,
  "NotLessLess;": 8810,
  "NotPrecedes;": 8832,
  "NotSucceeds;": 8833,
  "NotSuperset;": 8835,
  "OverBracket;": 9140,
  "RightVector;": 8640,
  "Rrightarrow;": 8667,
  "RuleDelayed;": 10740,
  "SmallCircle;": 8728,
  "SquareUnion;": 8852,
  "SubsetEqual;": 8838,
  "UpDownArrow;": 8597,
  "Updownarrow;": 8661,
  "VerticalBar;": 8739,
  "backepsilon;": 1014,
  "blacksquare;": 9642,
  "circledcirc;": 8858,
  "circleddash;": 8861,
  "curlyeqprec;": 8926,
  "curlyeqsucc;": 8927,
  "diamondsuit;": 9830,
  "eqslantless;": 10901,
  "expectation;": 8496,
  "nRightarrow;": 8655,
  "nrightarrow;": 8603,
  "preccurlyeq;": 8828,
  "precnapprox;": 10937,
  "quaternions;": 8461,
  "straightphi;": 981,
  "succcurlyeq;": 8829,
  "succnapprox;": 10938,
  "thickapprox;": 8776,
  "updownarrow;": 8597,
  "Bernoullis;": 8492,
  "CirclePlus;": 8853,
  "EqualTilde;": 8770,
  "Fouriertrf;": 8497,
  "ImaginaryI;": 8520,
  "Laplacetrf;": 8466,
  "LeftVector;": 8636,
  "Lleftarrow;": 8666,
  "NotElement;": 8713,
  "NotGreater;": 8815,
  "Proportion;": 8759,
  "RightArrow;": 8594,
  "RightFloor;": 8971,
  "Rightarrow;": 8658,
  "ThickSpace;": 8287,
  "TildeEqual;": 8771,
  "TildeTilde;": 8776,
  "UnderBrace;": 9183,
  "UpArrowBar;": 10514,
  "UpTeeArrow;": 8613,
  "circledast;": 8859,
  "complement;": 8705,
  "curlywedge;": 8911,
  "eqslantgtr;": 10902,
  "gtreqqless;": 10892,
  "lessapprox;": 10885,
  "lesseqqgtr;": 10891,
  "lmoustache;": 9136,
  "longmapsto;": 10236,
  "mapstodown;": 8615,
  "mapstoleft;": 8612,
  "nLeftarrow;": 8653,
  "nleftarrow;": 8602,
  "nsubseteqq;": 10949,
  "nsupseteqq;": 10950,
  "precapprox;": 10935,
  "rightarrow;": 8594,
  "rmoustache;": 9137,
  "sqsubseteq;": 8849,
  "sqsupseteq;": 8850,
  "subsetneqq;": 10955,
  "succapprox;": 10936,
  "supsetneqq;": 10956,
  "upuparrows;": 8648,
  "varepsilon;": 1013,
  "varnothing;": 8709,
  "Backslash;": 8726,
  "CenterDot;": 183,
  "CircleDot;": 8857,
  "Congruent;": 8801,
  "Coproduct;": 8720,
  "DoubleDot;": 168,
  "DownArrow;": 8595,
  "DownBreve;": 785,
  "Downarrow;": 8659,
  "HumpEqual;": 8783,
  "LeftArrow;": 8592,
  "LeftFloor;": 8970,
  "Leftarrow;": 8656,
  "LessTilde;": 8818,
  "Mellintrf;": 8499,
  "MinusPlus;": 8723,
  "NotCupCap;": 8813,
  "NotExists;": 8708,
  "NotSubset;": 8834,
  "OverBrace;": 9182,
  "PlusMinus;": 177,
  "Therefore;": 8756,
  "ThinSpace;": 8201,
  "TripleDot;": 8411,
  "UnionPlus;": 8846,
  "backprime;": 8245,
  "backsimeq;": 8909,
  "bigotimes;": 10754,
  "centerdot;": 183,
  "checkmark;": 10003,
  "complexes;": 8450,
  "dotsquare;": 8865,
  "downarrow;": 8595,
  "gtrapprox;": 10886,
  "gtreqless;": 8923,
  "gvertneqq;": 8809,
  "heartsuit;": 9829,
  "leftarrow;": 8592,
  "lesseqgtr;": 8922,
  "lvertneqq;": 8808,
  "ngeqslant;": 10878,
  "nleqslant;": 10877,
  "nparallel;": 8742,
  "nshortmid;": 8740,
  "nsubseteq;": 8840,
  "nsupseteq;": 8841,
  "pitchfork;": 8916,
  "rationals;": 8474,
  "spadesuit;": 9824,
  "subseteqq;": 10949,
  "subsetneq;": 8842,
  "supseteqq;": 10950,
  "supsetneq;": 8843,
  "therefore;": 8756,
  "triangleq;": 8796,
  "varpropto;": 8733,
  "DDotrahd;": 10513,
  "DotEqual;": 8784,
  "Integral;": 8747,
  "LessLess;": 10913,
  "NotEqual;": 8800,
  "NotTilde;": 8769,
  "PartialD;": 8706,
  "Precedes;": 8826,
  "RightTee;": 8866,
  "Succeeds;": 8827,
  "SuchThat;": 8715,
  "Superset;": 8835,
  "Uarrocir;": 10569,
  "UnderBar;": 95,
  "andslope;": 10840,
  "angmsdaa;": 10664,
  "angmsdab;": 10665,
  "angmsdac;": 10666,
  "angmsdad;": 10667,
  "angmsdae;": 10668,
  "angmsdaf;": 10669,
  "angmsdag;": 10670,
  "angmsdah;": 10671,
  "angrtvbd;": 10653,
  "approxeq;": 8778,
  "awconint;": 8755,
  "backcong;": 8780,
  "barwedge;": 8965,
  "bbrktbrk;": 9142,
  "bigoplus;": 10753,
  "bigsqcup;": 10758,
  "biguplus;": 10756,
  "bigwedge;": 8896,
  "boxminus;": 8863,
  "boxtimes;": 8864,
  "bsolhsub;": 10184,
  "capbrcup;": 10825,
  "circledR;": 174,
  "circledS;": 9416,
  "cirfnint;": 10768,
  "clubsuit;": 9827,
  "cupbrcap;": 10824,
  "curlyvee;": 8910,
  "cwconint;": 8754,
  "doteqdot;": 8785,
  "dotminus;": 8760,
  "drbkarow;": 10512,
  "dzigrarr;": 10239,
  "elinters;": 9191,
  "emptyset;": 8709,
  "eqvparsl;": 10725,
  "fpartint;": 10765,
  "geqslant;": 10878,
  "gesdotol;": 10884,
  "gnapprox;": 10890,
  "hksearow;": 10533,
  "hkswarow;": 10534,
  "imagline;": 8464,
  "imagpart;": 8465,
  "infintie;": 10717,
  "integers;": 8484,
  "intercal;": 8890,
  "intlarhk;": 10775,
  "laemptyv;": 10676,
  "ldrushar;": 10571,
  "leqslant;": 10877,
  "lesdotor;": 10883,
  "llcorner;": 8990,
  "lnapprox;": 10889,
  "lrcorner;": 8991,
  "lurdshar;": 10570,
  "mapstoup;": 8613,
  "multimap;": 8888,
  "naturals;": 8469,
  "ncongdot;": 10861,
  "notindot;": 8949,
  "otimesas;": 10806,
  "parallel;": 8741,
  "plusacir;": 10787,
  "pointint;": 10773,
  "precneqq;": 10933,
  "precnsim;": 8936,
  "profalar;": 9006,
  "profline;": 8978,
  "profsurf;": 8979,
  "raemptyv;": 10675,
  "realpart;": 8476,
  "rppolint;": 10770,
  "rtriltri;": 10702,
  "scpolint;": 10771,
  "setminus;": 8726,
  "shortmid;": 8739,
  "smeparsl;": 10724,
  "sqsubset;": 8847,
  "sqsupset;": 8848,
  "subseteq;": 8838,
  "succneqq;": 10934,
  "succnsim;": 8937,
  "supseteq;": 8839,
  "thetasym;": 977,
  "thicksim;": 8764,
  "timesbar;": 10801,
  "triangle;": 9653,
  "triminus;": 10810,
  "trpezium;": 9186,
  "ulcorner;": 8988,
  "urcorner;": 8989,
  "varkappa;": 1008,
  "varsigma;": 962,
  "vartheta;": 977,
  "Because;": 8757,
  "Cayleys;": 8493,
  "Cconint;": 8752,
  "Cedilla;": 184,
  "Diamond;": 8900,
  "DownTee;": 8868,
  "Element;": 8712,
  "Epsilon;": 917,
  "Implies;": 8658,
  "LeftTee;": 8867,
  "NewLine;": 10,
  "NoBreak;": 8288,
  "NotLess;": 8814,
  "Omicron;": 927,
  "OverBar;": 8254,
  "Product;": 8719,
  "UpArrow;": 8593,
  "Uparrow;": 8657,
  "Upsilon;": 933,
  "alefsym;": 8501,
  "angrtvb;": 8894,
  "angzarr;": 9084,
  "asympeq;": 8781,
  "backsim;": 8765,
  "because;": 8757,
  "bemptyv;": 10672,
  "between;": 8812,
  "bigcirc;": 9711,
  "bigodot;": 10752,
  "bigstar;": 9733,
  "bnequiv;": 8801,
  "boxplus;": 8862,
  "ccupssm;": 10832,
  "cemptyv;": 10674,
  "cirscir;": 10690,
  "coloneq;": 8788,
  "congdot;": 10861,
  "cudarrl;": 10552,
  "cudarrr;": 10549,
  "cularrp;": 10557,
  "curarrm;": 10556,
  "dbkarow;": 10511,
  "ddagger;": 8225,
  "ddotseq;": 10871,
  "demptyv;": 10673,
  "diamond;": 8900,
  "digamma;": 989,
  "dotplus;": 8724,
  "dwangle;": 10662,
  "epsilon;": 949,
  "eqcolon;": 8789,
  "equivDD;": 10872,
  "gesdoto;": 10882,
  "gtquest;": 10876,
  "gtrless;": 8823,
  "harrcir;": 10568,
  "intprod;": 10812,
  "isindot;": 8949,
  "larrbfs;": 10527,
  "larrsim;": 10611,
  "lbrksld;": 10639,
  "lbrkslu;": 10637,
  "ldrdhar;": 10599,
  "lesdoto;": 10881,
  "lessdot;": 8918,
  "lessgtr;": 8822,
  "lesssim;": 8818,
  "lotimes;": 10804,
  "lozenge;": 9674,
  "ltquest;": 10875,
  "luruhar;": 10598,
  "maltese;": 10016,
  "minusdu;": 10794,
  "napprox;": 8777,
  "natural;": 9838,
  "nearrow;": 8599,
  "nexists;": 8708,
  "notinva;": 8713,
  "notinvb;": 8951,
  "notinvc;": 8950,
  "notniva;": 8716,
  "notnivb;": 8958,
  "notnivc;": 8957,
  "npolint;": 10772,
  "npreceq;": 10927,
  "nsqsube;": 8930,
  "nsqsupe;": 8931,
  "nsubset;": 8834,
  "nsucceq;": 10928,
  "nsupset;": 8835,
  "nvinfin;": 10718,
  "nvltrie;": 8884,
  "nvrtrie;": 8885,
  "nwarrow;": 8598,
  "olcross;": 10683,
  "omicron;": 959,
  "orderof;": 8500,
  "orslope;": 10839,
  "pertenk;": 8241,
  "planckh;": 8462,
  "pluscir;": 10786,
  "plussim;": 10790,
  "plustwo;": 10791,
  "precsim;": 8830,
  "quatint;": 10774,
  "questeq;": 8799,
  "rarrbfs;": 10528,
  "rarrsim;": 10612,
  "rbrksld;": 10638,
  "rbrkslu;": 10640,
  "rdldhar;": 10601,
  "realine;": 8475,
  "rotimes;": 10805,
  "ruluhar;": 10600,
  "searrow;": 8600,
  "simplus;": 10788,
  "simrarr;": 10610,
  "subedot;": 10947,
  "submult;": 10945,
  "subplus;": 10943,
  "subrarr;": 10617,
  "succsim;": 8831,
  "supdsub;": 10968,
  "supedot;": 10948,
  "suphsol;": 10185,
  "suphsub;": 10967,
  "suplarr;": 10619,
  "supmult;": 10946,
  "supplus;": 10944,
  "swarrow;": 8601,
  "topfork;": 10970,
  "triplus;": 10809,
  "tritime;": 10811,
  "uparrow;": 8593,
  "upsilon;": 965,
  "uwangle;": 10663,
  "vzigzag;": 10650,
  "zigrarr;": 8669,
  "Aacute;": 193,
  "Abreve;": 258,
  "Agrave;": 192,
  "Assign;": 8788,
  "Atilde;": 195,
  "Barwed;": 8966,
  "Bumpeq;": 8782,
  "Cacute;": 262,
  "Ccaron;": 268,
  "Ccedil;": 199,
  "Colone;": 10868,
  "Conint;": 8751,
  "CupCap;": 8781,
  "Dagger;": 8225,
  "Dcaron;": 270,
  "DotDot;": 8412,
  "Dstrok;": 272,
  "Eacute;": 201,
  "Ecaron;": 282,
  "Egrave;": 200,
  "Exists;": 8707,
  "ForAll;": 8704,
  "Gammad;": 988,
  "Gbreve;": 286,
  "Gcedil;": 290,
  "HARDcy;": 1066,
  "Hstrok;": 294,
  "Iacute;": 205,
  "Igrave;": 204,
  "Itilde;": 296,
  "Jsercy;": 1032,
  "Kcedil;": 310,
  "Lacute;": 313,
  "Lambda;": 923,
  "Lcaron;": 317,
  "Lcedil;": 315,
  "Lmidot;": 319,
  "Lstrok;": 321,
  "Nacute;": 323,
  "Ncaron;": 327,
  "Ncedil;": 325,
  "Ntilde;": 209,
  "Oacute;": 211,
  "Odblac;": 336,
  "Ograve;": 210,
  "Oslash;": 216,
  "Otilde;": 213,
  "Otimes;": 10807,
  "Racute;": 340,
  "Rarrtl;": 10518,
  "Rcaron;": 344,
  "Rcedil;": 342,
  "SHCHcy;": 1065,
  "SOFTcy;": 1068,
  "Sacute;": 346,
  "Scaron;": 352,
  "Scedil;": 350,
  "Square;": 9633,
  "Subset;": 8912,
  "Supset;": 8913,
  "Tcaron;": 356,
  "Tcedil;": 354,
  "Tstrok;": 358,
  "Uacute;": 218,
  "Ubreve;": 364,
  "Udblac;": 368,
  "Ugrave;": 217,
  "Utilde;": 360,
  "Vdashl;": 10982,
  "Verbar;": 8214,
  "Vvdash;": 8874,
  "Yacute;": 221,
  "Zacute;": 377,
  "Zcaron;": 381,
  "aacute;": 225,
  "abreve;": 259,
  "agrave;": 224,
  "andand;": 10837,
  "angmsd;": 8737,
  "angsph;": 8738,
  "apacir;": 10863,
  "approx;": 8776,
  "atilde;": 227,
  "barvee;": 8893,
  "barwed;": 8965,
  "becaus;": 8757,
  "bernou;": 8492,
  "bigcap;": 8898,
  "bigcup;": 8899,
  "bigvee;": 8897,
  "bkarow;": 10509,
  "bottom;": 8869,
  "bowtie;": 8904,
  "boxbox;": 10697,
  "bprime;": 8245,
  "brvbar;": 166,
  "bullet;": 8226,
  "bumpeq;": 8783,
  "cacute;": 263,
  "capand;": 10820,
  "capcap;": 10827,
  "capcup;": 10823,
  "capdot;": 10816,
  "ccaron;": 269,
  "ccedil;": 231,
  "circeq;": 8791,
  "cirmid;": 10991,
  "colone;": 8788,
  "commat;": 64,
  "compfn;": 8728,
  "conint;": 8750,
  "coprod;": 8720,
  "copysr;": 8471,
  "cularr;": 8630,
  "cupcap;": 10822,
  "cupcup;": 10826,
  "cupdot;": 8845,
  "curarr;": 8631,
  "curren;": 164,
  "cylcty;": 9005,
  "dagger;": 8224,
  "daleth;": 8504,
  "dcaron;": 271,
  "dfisht;": 10623,
  "divide;": 247,
  "divonx;": 8903,
  "dlcorn;": 8990,
  "dlcrop;": 8973,
  "dollar;": 36,
  "drcorn;": 8991,
  "drcrop;": 8972,
  "dstrok;": 273,
  "eacute;": 233,
  "easter;": 10862,
  "ecaron;": 283,
  "ecolon;": 8789,
  "egrave;": 232,
  "egsdot;": 10904,
  "elsdot;": 10903,
  "emptyv;": 8709,
  "emsp13;": 8196,
  "emsp14;": 8197,
  "eparsl;": 10723,
  "eqcirc;": 8790,
  "equals;": 61,
  "equest;": 8799,
  "female;": 9792,
  "ffilig;": 64259,
  "ffllig;": 64260,
  "forall;": 8704,
  "frac12;": 189,
  "frac13;": 8531,
  "frac14;": 188,
  "frac15;": 8533,
  "frac16;": 8537,
  "frac18;": 8539,
  "frac23;": 8532,
  "frac25;": 8534,
  "frac34;": 190,
  "frac35;": 8535,
  "frac38;": 8540,
  "frac45;": 8536,
  "frac56;": 8538,
  "frac58;": 8541,
  "frac78;": 8542,
  "gacute;": 501,
  "gammad;": 989,
  "gbreve;": 287,
  "gesdot;": 10880,
  "gesles;": 10900,
  "gtlPar;": 10645,
  "gtrarr;": 10616,
  "gtrdot;": 8919,
  "gtrsim;": 8819,
  "hairsp;": 8202,
  "hamilt;": 8459,
  "hardcy;": 1098,
  "hearts;": 9829,
  "hellip;": 8230,
  "hercon;": 8889,
  "homtht;": 8763,
  "horbar;": 8213,
  "hslash;": 8463,
  "hstrok;": 295,
  "hybull;": 8259,
  "hyphen;": 8208,
  "iacute;": 237,
  "igrave;": 236,
  "iiiint;": 10764,
  "iinfin;": 10716,
  "incare;": 8453,
  "inodot;": 305,
  "intcal;": 8890,
  "iquest;": 191,
  "isinsv;": 8947,
  "itilde;": 297,
  "jsercy;": 1112,
  "kappav;": 1008,
  "kcedil;": 311,
  "kgreen;": 312,
  "lAtail;": 10523,
  "lacute;": 314,
  "lagran;": 8466,
  "lambda;": 955,
  "langle;": 10216,
  "larrfs;": 10525,
  "larrhk;": 8617,
  "larrlp;": 8619,
  "larrpl;": 10553,
  "larrtl;": 8610,
  "latail;": 10521,
  "lbrace;": 123,
  "lbrack;": 91,
  "lcaron;": 318,
  "lcedil;": 316,
  "ldquor;": 8222,
  "lesdot;": 10879,
  "lesges;": 10899,
  "lfisht;": 10620,
  "lfloor;": 8970,
  "lharul;": 10602,
  "llhard;": 10603,
  "lmidot;": 320,
  "lmoust;": 9136,
  "loplus;": 10797,
  "lowast;": 8727,
  "lowbar;": 95,
  "lparlt;": 10643,
  "lrhard;": 10605,
  "lsaquo;": 8249,
  "lsquor;": 8218,
  "lstrok;": 322,
  "lthree;": 8907,
  "ltimes;": 8905,
  "ltlarr;": 10614,
  "ltrPar;": 10646,
  "mapsto;": 8614,
  "marker;": 9646,
  "mcomma;": 10793,
  "midast;": 42,
  "midcir;": 10992,
  "middot;": 183,
  "minusb;": 8863,
  "minusd;": 8760,
  "mnplus;": 8723,
  "models;": 8871,
  "mstpos;": 8766,
  "nVDash;": 8879,
  "nVdash;": 8878,
  "nacute;": 324,
  "nbumpe;": 8783,
  "ncaron;": 328,
  "ncedil;": 326,
  "nearhk;": 10532,
  "nequiv;": 8802,
  "nesear;": 10536,
  "nexist;": 8708,
  "nltrie;": 8940,
  "notinE;": 8953,
  "nparsl;": 11005,
  "nprcue;": 8928,
  "nrarrc;": 10547,
  "nrarrw;": 8605,
  "nrtrie;": 8941,
  "nsccue;": 8929,
  "nsimeq;": 8772,
  "ntilde;": 241,
  "numero;": 8470,
  "nvDash;": 8877,
  "nvHarr;": 10500,
  "nvdash;": 8876,
  "nvlArr;": 10498,
  "nvrArr;": 10499,
  "nwarhk;": 10531,
  "nwnear;": 10535,
  "oacute;": 243,
  "odblac;": 337,
  "odsold;": 10684,
  "ograve;": 242,
  "ominus;": 8854,
  "origof;": 8886,
  "oslash;": 248,
  "otilde;": 245,
  "otimes;": 8855,
  "parsim;": 10995,
  "percnt;": 37,
  "period;": 46,
  "permil;": 8240,
  "phmmat;": 8499,
  "planck;": 8463,
  "plankv;": 8463,
  "plusdo;": 8724,
  "plusdu;": 10789,
  "plusmn;": 177,
  "preceq;": 10927,
  "primes;": 8473,
  "prnsim;": 8936,
  "propto;": 8733,
  "prurel;": 8880,
  "puncsp;": 8200,
  "qprime;": 8279,
  "rAtail;": 10524,
  "racute;": 341,
  "rangle;": 10217,
  "rarrap;": 10613,
  "rarrfs;": 10526,
  "rarrhk;": 8618,
  "rarrlp;": 8620,
  "rarrpl;": 10565,
  "rarrtl;": 8611,
  "ratail;": 10522,
  "rbrace;": 125,
  "rbrack;": 93,
  "rcaron;": 345,
  "rcedil;": 343,
  "rdquor;": 8221,
  "rfisht;": 10621,
  "rfloor;": 8971,
  "rharul;": 10604,
  "rmoust;": 9137,
  "roplus;": 10798,
  "rpargt;": 10644,
  "rsaquo;": 8250,
  "rsquor;": 8217,
  "rthree;": 8908,
  "rtimes;": 8906,
  "sacute;": 347,
  "scaron;": 353,
  "scedil;": 351,
  "scnsim;": 8937,
  "searhk;": 10533,
  "seswar;": 10537,
  "sfrown;": 8994,
  "shchcy;": 1097,
  "sigmaf;": 962,
  "sigmav;": 962,
  "simdot;": 10858,
  "smashp;": 10803,
  "softcy;": 1100,
  "solbar;": 9023,
  "spades;": 9824,
  "sqcaps;": 8851,
  "sqcups;": 8852,
  "sqsube;": 8849,
  "sqsupe;": 8850,
  "square;": 9633,
  "squarf;": 9642,
  "ssetmn;": 8726,
  "ssmile;": 8995,
  "sstarf;": 8902,
  "subdot;": 10941,
  "subset;": 8834,
  "subsim;": 10951,
  "subsub;": 10965,
  "subsup;": 10963,
  "succeq;": 10928,
  "supdot;": 10942,
  "supset;": 8835,
  "supsim;": 10952,
  "supsub;": 10964,
  "supsup;": 10966,
  "swarhk;": 10534,
  "swnwar;": 10538,
  "target;": 8982,
  "tcaron;": 357,
  "tcedil;": 355,
  "telrec;": 8981,
  "there4;": 8756,
  "thetav;": 977,
  "thinsp;": 8201,
  "thksim;": 8764,
  "timesb;": 8864,
  "timesd;": 10800,
  "topbot;": 9014,
  "topcir;": 10993,
  "tprime;": 8244,
  "tridot;": 9708,
  "tstrok;": 359,
  "uacute;": 250,
  "ubreve;": 365,
  "udblac;": 369,
  "ufisht;": 10622,
  "ugrave;": 249,
  "ulcorn;": 8988,
  "ulcrop;": 8975,
  "urcorn;": 8989,
  "urcrop;": 8974,
  "utilde;": 361,
  "vangrt;": 10652,
  "varphi;": 981,
  "varrho;": 1009,
  "veebar;": 8891,
  "vellip;": 8942,
  "verbar;": 124,
  "vsubnE;": 10955,
  "vsubne;": 8842,
  "vsupnE;": 10956,
  "vsupne;": 8843,
  "wedbar;": 10847,
  "wedgeq;": 8793,
  "weierp;": 8472,
  "wreath;": 8768,
  "xoplus;": 10753,
  "xotime;": 10754,
  "xsqcup;": 10758,
  "xuplus;": 10756,
  "xwedge;": 8896,
  "yacute;": 253,
  "zacute;": 378,
  "zcaron;": 382,
  "zeetrf;": 8488,
  "AElig;": 198,
  Aacute: 193,
  "Acirc;": 194,
  Agrave: 192,
  "Alpha;": 913,
  "Amacr;": 256,
  "Aogon;": 260,
  "Aring;": 197,
  Atilde: 195,
  "Breve;": 728,
  Ccedil: 199,
  "Ccirc;": 264,
  "Colon;": 8759,
  "Cross;": 10799,
  "Dashv;": 10980,
  "Delta;": 916,
  Eacute: 201,
  "Ecirc;": 202,
  Egrave: 200,
  "Emacr;": 274,
  "Eogon;": 280,
  "Equal;": 10869,
  "Gamma;": 915,
  "Gcirc;": 284,
  "Hacek;": 711,
  "Hcirc;": 292,
  "IJlig;": 306,
  Iacute: 205,
  "Icirc;": 206,
  Igrave: 204,
  "Imacr;": 298,
  "Iogon;": 302,
  "Iukcy;": 1030,
  "Jcirc;": 308,
  "Jukcy;": 1028,
  "Kappa;": 922,
  Ntilde: 209,
  "OElig;": 338,
  Oacute: 211,
  "Ocirc;": 212,
  Ograve: 210,
  "Omacr;": 332,
  "Omega;": 937,
  Oslash: 216,
  Otilde: 213,
  "Prime;": 8243,
  "RBarr;": 10512,
  "Scirc;": 348,
  "Sigma;": 931,
  "THORN;": 222,
  "TRADE;": 8482,
  "TSHcy;": 1035,
  "Theta;": 920,
  "Tilde;": 8764,
  Uacute: 218,
  "Ubrcy;": 1038,
  "Ucirc;": 219,
  Ugrave: 217,
  "Umacr;": 362,
  "Union;": 8899,
  "Uogon;": 370,
  "UpTee;": 8869,
  "Uring;": 366,
  "VDash;": 8875,
  "Vdash;": 8873,
  "Wcirc;": 372,
  "Wedge;": 8896,
  Yacute: 221,
  "Ycirc;": 374,
  aacute: 225,
  "acirc;": 226,
  "acute;": 180,
  "aelig;": 230,
  agrave: 224,
  "aleph;": 8501,
  "alpha;": 945,
  "amacr;": 257,
  "amalg;": 10815,
  "angle;": 8736,
  "angrt;": 8735,
  "angst;": 197,
  "aogon;": 261,
  "aring;": 229,
  "asymp;": 8776,
  atilde: 227,
  "awint;": 10769,
  "bcong;": 8780,
  "bdquo;": 8222,
  "bepsi;": 1014,
  "blank;": 9251,
  "blk12;": 9618,
  "blk14;": 9617,
  "blk34;": 9619,
  "block;": 9608,
  "boxDL;": 9559,
  "boxDR;": 9556,
  "boxDl;": 9558,
  "boxDr;": 9555,
  "boxHD;": 9574,
  "boxHU;": 9577,
  "boxHd;": 9572,
  "boxHu;": 9575,
  "boxUL;": 9565,
  "boxUR;": 9562,
  "boxUl;": 9564,
  "boxUr;": 9561,
  "boxVH;": 9580,
  "boxVL;": 9571,
  "boxVR;": 9568,
  "boxVh;": 9579,
  "boxVl;": 9570,
  "boxVr;": 9567,
  "boxdL;": 9557,
  "boxdR;": 9554,
  "boxdl;": 9488,
  "boxdr;": 9484,
  "boxhD;": 9573,
  "boxhU;": 9576,
  "boxhd;": 9516,
  "boxhu;": 9524,
  "boxuL;": 9563,
  "boxuR;": 9560,
  "boxul;": 9496,
  "boxur;": 9492,
  "boxvH;": 9578,
  "boxvL;": 9569,
  "boxvR;": 9566,
  "boxvh;": 9532,
  "boxvl;": 9508,
  "boxvr;": 9500,
  "breve;": 728,
  brvbar: 166,
  "bsemi;": 8271,
  "bsime;": 8909,
  "bsolb;": 10693,
  "bumpE;": 10926,
  "bumpe;": 8783,
  "caret;": 8257,
  "caron;": 711,
  "ccaps;": 10829,
  ccedil: 231,
  "ccirc;": 265,
  "ccups;": 10828,
  "cedil;": 184,
  "check;": 10003,
  "clubs;": 9827,
  "colon;": 58,
  "comma;": 44,
  "crarr;": 8629,
  "cross;": 10007,
  "csube;": 10961,
  "csupe;": 10962,
  "ctdot;": 8943,
  "cuepr;": 8926,
  "cuesc;": 8927,
  "cupor;": 10821,
  curren: 164,
  "cuvee;": 8910,
  "cuwed;": 8911,
  "cwint;": 8753,
  "dashv;": 8867,
  "dblac;": 733,
  "ddarr;": 8650,
  "delta;": 948,
  "dharl;": 8643,
  "dharr;": 8642,
  "diams;": 9830,
  "disin;": 8946,
  divide: 247,
  "doteq;": 8784,
  "dtdot;": 8945,
  "dtrif;": 9662,
  "duarr;": 8693,
  "duhar;": 10607,
  "eDDot;": 10871,
  eacute: 233,
  "ecirc;": 234,
  "efDot;": 8786,
  egrave: 232,
  "emacr;": 275,
  "empty;": 8709,
  "eogon;": 281,
  "eplus;": 10865,
  "epsiv;": 1013,
  "eqsim;": 8770,
  "equiv;": 8801,
  "erDot;": 8787,
  "erarr;": 10609,
  "esdot;": 8784,
  "exist;": 8707,
  "fflig;": 64256,
  "filig;": 64257,
  "fjlig;": 102,
  "fllig;": 64258,
  "fltns;": 9649,
  "forkv;": 10969,
  frac12: 189,
  frac14: 188,
  frac34: 190,
  "frasl;": 8260,
  "frown;": 8994,
  "gamma;": 947,
  "gcirc;": 285,
  "gescc;": 10921,
  "gimel;": 8503,
  "gneqq;": 8809,
  "gnsim;": 8935,
  "grave;": 96,
  "gsime;": 10894,
  "gsiml;": 10896,
  "gtcir;": 10874,
  "gtdot;": 8919,
  "harrw;": 8621,
  "hcirc;": 293,
  "hoarr;": 8703,
  iacute: 237,
  "icirc;": 238,
  "iexcl;": 161,
  igrave: 236,
  "iiint;": 8749,
  "iiota;": 8489,
  "ijlig;": 307,
  "imacr;": 299,
  "image;": 8465,
  "imath;": 305,
  "imped;": 437,
  "infin;": 8734,
  "iogon;": 303,
  "iprod;": 10812,
  iquest: 191,
  "isinE;": 8953,
  "isins;": 8948,
  "isinv;": 8712,
  "iukcy;": 1110,
  "jcirc;": 309,
  "jmath;": 567,
  "jukcy;": 1108,
  "kappa;": 954,
  "lAarr;": 8666,
  "lBarr;": 10510,
  "langd;": 10641,
  "laquo;": 171,
  "larrb;": 8676,
  "lates;": 10925,
  "lbarr;": 10508,
  "lbbrk;": 10098,
  "lbrke;": 10635,
  "lceil;": 8968,
  "ldquo;": 8220,
  "lescc;": 10920,
  "lhard;": 8637,
  "lharu;": 8636,
  "lhblk;": 9604,
  "llarr;": 8647,
  "lltri;": 9722,
  "lneqq;": 8808,
  "lnsim;": 8934,
  "loang;": 10220,
  "loarr;": 8701,
  "lobrk;": 10214,
  "lopar;": 10629,
  "lrarr;": 8646,
  "lrhar;": 8651,
  "lrtri;": 8895,
  "lsime;": 10893,
  "lsimg;": 10895,
  "lsquo;": 8216,
  "ltcir;": 10873,
  "ltdot;": 8918,
  "ltrie;": 8884,
  "ltrif;": 9666,
  "mDDot;": 8762,
  "mdash;": 8212,
  "micro;": 181,
  middot: 183,
  "minus;": 8722,
  "mumap;": 8888,
  "nabla;": 8711,
  "napid;": 8779,
  "napos;": 329,
  "natur;": 9838,
  "nbump;": 8782,
  "ncong;": 8775,
  "ndash;": 8211,
  "neArr;": 8663,
  "nearr;": 8599,
  "nedot;": 8784,
  "nesim;": 8770,
  "ngeqq;": 8807,
  "ngsim;": 8821,
  "nhArr;": 8654,
  "nharr;": 8622,
  "nhpar;": 10994,
  "nlArr;": 8653,
  "nlarr;": 8602,
  "nleqq;": 8806,
  "nless;": 8814,
  "nlsim;": 8820,
  "nltri;": 8938,
  "notin;": 8713,
  "notni;": 8716,
  "npart;": 8706,
  "nprec;": 8832,
  "nrArr;": 8655,
  "nrarr;": 8603,
  "nrtri;": 8939,
  "nsime;": 8772,
  "nsmid;": 8740,
  "nspar;": 8742,
  "nsubE;": 10949,
  "nsube;": 8840,
  "nsucc;": 8833,
  "nsupE;": 10950,
  "nsupe;": 8841,
  ntilde: 241,
  "numsp;": 8199,
  "nvsim;": 8764,
  "nwArr;": 8662,
  "nwarr;": 8598,
  oacute: 243,
  "ocirc;": 244,
  "odash;": 8861,
  "oelig;": 339,
  "ofcir;": 10687,
  ograve: 242,
  "ohbar;": 10677,
  "olarr;": 8634,
  "olcir;": 10686,
  "oline;": 8254,
  "omacr;": 333,
  "omega;": 969,
  "operp;": 10681,
  "oplus;": 8853,
  "orarr;": 8635,
  "order;": 8500,
  oslash: 248,
  otilde: 245,
  "ovbar;": 9021,
  "parsl;": 11005,
  "phone;": 9742,
  "plusb;": 8862,
  "pluse;": 10866,
  plusmn: 177,
  "pound;": 163,
  "prcue;": 8828,
  "prime;": 8242,
  "prnap;": 10937,
  "prsim;": 8830,
  "quest;": 63,
  "rAarr;": 8667,
  "rBarr;": 10511,
  "radic;": 8730,
  "rangd;": 10642,
  "range;": 10661,
  "raquo;": 187,
  "rarrb;": 8677,
  "rarrc;": 10547,
  "rarrw;": 8605,
  "ratio;": 8758,
  "rbarr;": 10509,
  "rbbrk;": 10099,
  "rbrke;": 10636,
  "rceil;": 8969,
  "rdquo;": 8221,
  "reals;": 8477,
  "rhard;": 8641,
  "rharu;": 8640,
  "rlarr;": 8644,
  "rlhar;": 8652,
  "rnmid;": 10990,
  "roang;": 10221,
  "roarr;": 8702,
  "robrk;": 10215,
  "ropar;": 10630,
  "rrarr;": 8649,
  "rsquo;": 8217,
  "rtrie;": 8885,
  "rtrif;": 9656,
  "sbquo;": 8218,
  "sccue;": 8829,
  "scirc;": 349,
  "scnap;": 10938,
  "scsim;": 8831,
  "sdotb;": 8865,
  "sdote;": 10854,
  "seArr;": 8664,
  "searr;": 8600,
  "setmn;": 8726,
  "sharp;": 9839,
  "sigma;": 963,
  "simeq;": 8771,
  "simgE;": 10912,
  "simlE;": 10911,
  "simne;": 8774,
  "slarr;": 8592,
  "smile;": 8995,
  "smtes;": 10924,
  "sqcap;": 8851,
  "sqcup;": 8852,
  "sqsub;": 8847,
  "sqsup;": 8848,
  "srarr;": 8594,
  "starf;": 9733,
  "strns;": 175,
  "subnE;": 10955,
  "subne;": 8842,
  "supnE;": 10956,
  "supne;": 8843,
  "swArr;": 8665,
  "swarr;": 8601,
  "szlig;": 223,
  "theta;": 952,
  "thkap;": 8776,
  "thorn;": 254,
  "tilde;": 732,
  "times;": 215,
  "trade;": 8482,
  "trisb;": 10701,
  "tshcy;": 1115,
  "twixt;": 8812,
  uacute: 250,
  "ubrcy;": 1118,
  "ucirc;": 251,
  "udarr;": 8645,
  "udhar;": 10606,
  ugrave: 249,
  "uharl;": 8639,
  "uharr;": 8638,
  "uhblk;": 9600,
  "ultri;": 9720,
  "umacr;": 363,
  "uogon;": 371,
  "uplus;": 8846,
  "upsih;": 978,
  "uring;": 367,
  "urtri;": 9721,
  "utdot;": 8944,
  "utrif;": 9652,
  "uuarr;": 8648,
  "vBarv;": 10985,
  "vDash;": 8872,
  "varpi;": 982,
  "vdash;": 8866,
  "veeeq;": 8794,
  "vltri;": 8882,
  "vnsub;": 8834,
  "vnsup;": 8835,
  "vprop;": 8733,
  "vrtri;": 8883,
  "wcirc;": 373,
  "wedge;": 8743,
  "xcirc;": 9711,
  "xdtri;": 9661,
  "xhArr;": 10234,
  "xharr;": 10231,
  "xlArr;": 10232,
  "xlarr;": 10229,
  "xodot;": 10752,
  "xrArr;": 10233,
  "xrarr;": 10230,
  "xutri;": 9651,
  yacute: 253,
  "ycirc;": 375,
  AElig: 198,
  Acirc: 194,
  "Aopf;": 120120,
  Aring: 197,
  "Ascr;": 119964,
  "Auml;": 196,
  "Barv;": 10983,
  "Beta;": 914,
  "Bopf;": 120121,
  "Bscr;": 8492,
  "CHcy;": 1063,
  "COPY;": 169,
  "Cdot;": 266,
  "Copf;": 8450,
  "Cscr;": 119966,
  "DJcy;": 1026,
  "DScy;": 1029,
  "DZcy;": 1039,
  "Darr;": 8609,
  "Dopf;": 120123,
  "Dscr;": 119967,
  Ecirc: 202,
  "Edot;": 278,
  "Eopf;": 120124,
  "Escr;": 8496,
  "Esim;": 10867,
  "Euml;": 203,
  "Fopf;": 120125,
  "Fscr;": 8497,
  "GJcy;": 1027,
  "Gdot;": 288,
  "Gopf;": 120126,
  "Gscr;": 119970,
  "Hopf;": 8461,
  "Hscr;": 8459,
  "IEcy;": 1045,
  "IOcy;": 1025,
  Icirc: 206,
  "Idot;": 304,
  "Iopf;": 120128,
  "Iota;": 921,
  "Iscr;": 8464,
  "Iuml;": 207,
  "Jopf;": 120129,
  "Jscr;": 119973,
  "KHcy;": 1061,
  "KJcy;": 1036,
  "Kopf;": 120130,
  "Kscr;": 119974,
  "LJcy;": 1033,
  "Lang;": 10218,
  "Larr;": 8606,
  "Lopf;": 120131,
  "Lscr;": 8466,
  "Mopf;": 120132,
  "Mscr;": 8499,
  "NJcy;": 1034,
  "Nopf;": 8469,
  "Nscr;": 119977,
  Ocirc: 212,
  "Oopf;": 120134,
  "Oscr;": 119978,
  "Ouml;": 214,
  "Popf;": 8473,
  "Pscr;": 119979,
  "QUOT;": 34,
  "Qopf;": 8474,
  "Qscr;": 119980,
  "Rang;": 10219,
  "Rarr;": 8608,
  "Ropf;": 8477,
  "Rscr;": 8475,
  "SHcy;": 1064,
  "Sopf;": 120138,
  "Sqrt;": 8730,
  "Sscr;": 119982,
  "Star;": 8902,
  THORN: 222,
  "TScy;": 1062,
  "Topf;": 120139,
  "Tscr;": 119983,
  "Uarr;": 8607,
  Ucirc: 219,
  "Uopf;": 120140,
  "Upsi;": 978,
  "Uscr;": 119984,
  "Uuml;": 220,
  "Vbar;": 10987,
  "Vert;": 8214,
  "Vopf;": 120141,
  "Vscr;": 119985,
  "Wopf;": 120142,
  "Wscr;": 119986,
  "Xopf;": 120143,
  "Xscr;": 119987,
  "YAcy;": 1071,
  "YIcy;": 1031,
  "YUcy;": 1070,
  "Yopf;": 120144,
  "Yscr;": 119988,
  "Yuml;": 376,
  "ZHcy;": 1046,
  "Zdot;": 379,
  "Zeta;": 918,
  "Zopf;": 8484,
  "Zscr;": 119989,
  acirc: 226,
  acute: 180,
  aelig: 230,
  "andd;": 10844,
  "andv;": 10842,
  "ange;": 10660,
  "aopf;": 120146,
  "apid;": 8779,
  "apos;": 39,
  aring: 229,
  "ascr;": 119990,
  "auml;": 228,
  "bNot;": 10989,
  "bbrk;": 9141,
  "beta;": 946,
  "beth;": 8502,
  "bnot;": 8976,
  "bopf;": 120147,
  "boxH;": 9552,
  "boxV;": 9553,
  "boxh;": 9472,
  "boxv;": 9474,
  "bscr;": 119991,
  "bsim;": 8765,
  "bsol;": 92,
  "bull;": 8226,
  "bump;": 8782,
  "caps;": 8745,
  "cdot;": 267,
  cedil: 184,
  "cent;": 162,
  "chcy;": 1095,
  "cirE;": 10691,
  "circ;": 710,
  "cire;": 8791,
  "comp;": 8705,
  "cong;": 8773,
  "copf;": 120148,
  "copy;": 169,
  "cscr;": 119992,
  "csub;": 10959,
  "csup;": 10960,
  "cups;": 8746,
  "dArr;": 8659,
  "dHar;": 10597,
  "darr;": 8595,
  "dash;": 8208,
  "diam;": 8900,
  "djcy;": 1106,
  "dopf;": 120149,
  "dscr;": 119993,
  "dscy;": 1109,
  "dsol;": 10742,
  "dtri;": 9663,
  "dzcy;": 1119,
  "eDot;": 8785,
  "ecir;": 8790,
  ecirc: 234,
  "edot;": 279,
  "emsp;": 8195,
  "ensp;": 8194,
  "eopf;": 120150,
  "epar;": 8917,
  "epsi;": 949,
  "escr;": 8495,
  "esim;": 8770,
  "euml;": 235,
  "euro;": 8364,
  "excl;": 33,
  "flat;": 9837,
  "fnof;": 402,
  "fopf;": 120151,
  "fork;": 8916,
  "fscr;": 119995,
  "gdot;": 289,
  "geqq;": 8807,
  "gesl;": 8923,
  "gjcy;": 1107,
  "gnap;": 10890,
  "gneq;": 10888,
  "gopf;": 120152,
  "gscr;": 8458,
  "gsim;": 8819,
  "gtcc;": 10919,
  "gvnE;": 8809,
  "hArr;": 8660,
  "half;": 189,
  "harr;": 8596,
  "hbar;": 8463,
  "hopf;": 120153,
  "hscr;": 119997,
  icirc: 238,
  "iecy;": 1077,
  iexcl: 161,
  "imof;": 8887,
  "iocy;": 1105,
  "iopf;": 120154,
  "iota;": 953,
  "iscr;": 119998,
  "isin;": 8712,
  "iuml;": 239,
  "jopf;": 120155,
  "jscr;": 119999,
  "khcy;": 1093,
  "kjcy;": 1116,
  "kopf;": 120156,
  "kscr;": 12e4,
  "lArr;": 8656,
  "lHar;": 10594,
  "lang;": 10216,
  laquo: 171,
  "larr;": 8592,
  "late;": 10925,
  "lcub;": 123,
  "ldca;": 10550,
  "ldsh;": 8626,
  "leqq;": 8806,
  "lesg;": 8922,
  "ljcy;": 1113,
  "lnap;": 10889,
  "lneq;": 10887,
  "lopf;": 120157,
  "lozf;": 10731,
  "lpar;": 40,
  "lscr;": 120001,
  "lsim;": 8818,
  "lsqb;": 91,
  "ltcc;": 10918,
  "ltri;": 9667,
  "lvnE;": 8808,
  "macr;": 175,
  "male;": 9794,
  "malt;": 10016,
  micro: 181,
  "mlcp;": 10971,
  "mldr;": 8230,
  "mopf;": 120158,
  "mscr;": 120002,
  "nGtv;": 8811,
  "nLtv;": 8810,
  "nang;": 8736,
  "napE;": 10864,
  "nbsp;": 160,
  "ncap;": 10819,
  "ncup;": 10818,
  "ngeq;": 8817,
  "nges;": 10878,
  "ngtr;": 8815,
  "nisd;": 8954,
  "njcy;": 1114,
  "nldr;": 8229,
  "nleq;": 8816,
  "nles;": 10877,
  "nmid;": 8740,
  "nopf;": 120159,
  "npar;": 8742,
  "npre;": 10927,
  "nsce;": 10928,
  "nscr;": 120003,
  "nsim;": 8769,
  "nsub;": 8836,
  "nsup;": 8837,
  "ntgl;": 8825,
  "ntlg;": 8824,
  "nvap;": 8781,
  "nvge;": 8805,
  "nvgt;": 62,
  "nvle;": 8804,
  "nvlt;": 60,
  "oast;": 8859,
  "ocir;": 8858,
  ocirc: 244,
  "odiv;": 10808,
  "odot;": 8857,
  "ogon;": 731,
  "oint;": 8750,
  "omid;": 10678,
  "oopf;": 120160,
  "opar;": 10679,
  "ordf;": 170,
  "ordm;": 186,
  "oror;": 10838,
  "oscr;": 8500,
  "osol;": 8856,
  "ouml;": 246,
  "para;": 182,
  "part;": 8706,
  "perp;": 8869,
  "phiv;": 981,
  "plus;": 43,
  "popf;": 120161,
  pound: 163,
  "prap;": 10935,
  "prec;": 8826,
  "prnE;": 10933,
  "prod;": 8719,
  "prop;": 8733,
  "pscr;": 120005,
  "qint;": 10764,
  "qopf;": 120162,
  "qscr;": 120006,
  "quot;": 34,
  "rArr;": 8658,
  "rHar;": 10596,
  "race;": 8765,
  "rang;": 10217,
  raquo: 187,
  "rarr;": 8594,
  "rcub;": 125,
  "rdca;": 10551,
  "rdsh;": 8627,
  "real;": 8476,
  "rect;": 9645,
  "rhov;": 1009,
  "ring;": 730,
  "ropf;": 120163,
  "rpar;": 41,
  "rscr;": 120007,
  "rsqb;": 93,
  "rtri;": 9657,
  "scap;": 10936,
  "scnE;": 10934,
  "sdot;": 8901,
  "sect;": 167,
  "semi;": 59,
  "sext;": 10038,
  "shcy;": 1096,
  "sime;": 8771,
  "simg;": 10910,
  "siml;": 10909,
  "smid;": 8739,
  "smte;": 10924,
  "solb;": 10692,
  "sopf;": 120164,
  "spar;": 8741,
  "squf;": 9642,
  "sscr;": 120008,
  "star;": 9734,
  "subE;": 10949,
  "sube;": 8838,
  "succ;": 8827,
  "sung;": 9834,
  "sup1;": 185,
  "sup2;": 178,
  "sup3;": 179,
  "supE;": 10950,
  "supe;": 8839,
  szlig: 223,
  "tbrk;": 9140,
  "tdot;": 8411,
  thorn: 254,
  times: 215,
  "tint;": 8749,
  "toea;": 10536,
  "topf;": 120165,
  "tosa;": 10537,
  "trie;": 8796,
  "tscr;": 120009,
  "tscy;": 1094,
  "uArr;": 8657,
  "uHar;": 10595,
  "uarr;": 8593,
  ucirc: 251,
  "uopf;": 120166,
  "upsi;": 965,
  "uscr;": 120010,
  "utri;": 9653,
  "uuml;": 252,
  "vArr;": 8661,
  "vBar;": 10984,
  "varr;": 8597,
  "vert;": 124,
  "vopf;": 120167,
  "vscr;": 120011,
  "wopf;": 120168,
  "wscr;": 120012,
  "xcap;": 8898,
  "xcup;": 8899,
  "xmap;": 10236,
  "xnis;": 8955,
  "xopf;": 120169,
  "xscr;": 120013,
  "xvee;": 8897,
  "yacy;": 1103,
  "yicy;": 1111,
  "yopf;": 120170,
  "yscr;": 120014,
  "yucy;": 1102,
  "yuml;": 255,
  "zdot;": 380,
  "zeta;": 950,
  "zhcy;": 1078,
  "zopf;": 120171,
  "zscr;": 120015,
  "zwnj;": 8204,
  "AMP;": 38,
  "Acy;": 1040,
  "Afr;": 120068,
  "And;": 10835,
  Auml: 196,
  "Bcy;": 1041,
  "Bfr;": 120069,
  COPY: 169,
  "Cap;": 8914,
  "Cfr;": 8493,
  "Chi;": 935,
  "Cup;": 8915,
  "Dcy;": 1044,
  "Del;": 8711,
  "Dfr;": 120071,
  "Dot;": 168,
  "ENG;": 330,
  "ETH;": 208,
  "Ecy;": 1069,
  "Efr;": 120072,
  "Eta;": 919,
  Euml: 203,
  "Fcy;": 1060,
  "Ffr;": 120073,
  "Gcy;": 1043,
  "Gfr;": 120074,
  "Hat;": 94,
  "Hfr;": 8460,
  "Icy;": 1048,
  "Ifr;": 8465,
  "Int;": 8748,
  Iuml: 207,
  "Jcy;": 1049,
  "Jfr;": 120077,
  "Kcy;": 1050,
  "Kfr;": 120078,
  "Lcy;": 1051,
  "Lfr;": 120079,
  "Lsh;": 8624,
  "Map;": 10501,
  "Mcy;": 1052,
  "Mfr;": 120080,
  "Ncy;": 1053,
  "Nfr;": 120081,
  "Not;": 10988,
  "Ocy;": 1054,
  "Ofr;": 120082,
  Ouml: 214,
  "Pcy;": 1055,
  "Pfr;": 120083,
  "Phi;": 934,
  "Psi;": 936,
  QUOT: 34,
  "Qfr;": 120084,
  "REG;": 174,
  "Rcy;": 1056,
  "Rfr;": 8476,
  "Rho;": 929,
  "Rsh;": 8625,
  "Scy;": 1057,
  "Sfr;": 120086,
  "Sub;": 8912,
  "Sum;": 8721,
  "Sup;": 8913,
  "Tab;": 9,
  "Tau;": 932,
  "Tcy;": 1058,
  "Tfr;": 120087,
  "Ucy;": 1059,
  "Ufr;": 120088,
  Uuml: 220,
  "Vcy;": 1042,
  "Vee;": 8897,
  "Vfr;": 120089,
  "Wfr;": 120090,
  "Xfr;": 120091,
  "Ycy;": 1067,
  "Yfr;": 120092,
  "Zcy;": 1047,
  "Zfr;": 8488,
  "acE;": 8766,
  "acd;": 8767,
  "acy;": 1072,
  "afr;": 120094,
  "amp;": 38,
  "and;": 8743,
  "ang;": 8736,
  "apE;": 10864,
  "ape;": 8778,
  "ast;": 42,
  auml: 228,
  "bcy;": 1073,
  "bfr;": 120095,
  "bne;": 61,
  "bot;": 8869,
  "cap;": 8745,
  cent: 162,
  "cfr;": 120096,
  "chi;": 967,
  "cir;": 9675,
  copy: 169,
  "cup;": 8746,
  "dcy;": 1076,
  "deg;": 176,
  "dfr;": 120097,
  "die;": 168,
  "div;": 247,
  "dot;": 729,
  "ecy;": 1101,
  "efr;": 120098,
  "egs;": 10902,
  "ell;": 8467,
  "els;": 10901,
  "eng;": 331,
  "eta;": 951,
  "eth;": 240,
  euml: 235,
  "fcy;": 1092,
  "ffr;": 120099,
  "gEl;": 10892,
  "gap;": 10886,
  "gcy;": 1075,
  "gel;": 8923,
  "geq;": 8805,
  "ges;": 10878,
  "gfr;": 120100,
  "ggg;": 8921,
  "glE;": 10898,
  "gla;": 10917,
  "glj;": 10916,
  "gnE;": 8809,
  "gne;": 10888,
  "hfr;": 120101,
  "icy;": 1080,
  "iff;": 8660,
  "ifr;": 120102,
  "int;": 8747,
  iuml: 239,
  "jcy;": 1081,
  "jfr;": 120103,
  "kcy;": 1082,
  "kfr;": 120104,
  "lEg;": 10891,
  "lap;": 10885,
  "lat;": 10923,
  "lcy;": 1083,
  "leg;": 8922,
  "leq;": 8804,
  "les;": 10877,
  "lfr;": 120105,
  "lgE;": 10897,
  "lnE;": 8808,
  "lne;": 10887,
  "loz;": 9674,
  "lrm;": 8206,
  "lsh;": 8624,
  macr: 175,
  "map;": 8614,
  "mcy;": 1084,
  "mfr;": 120106,
  "mho;": 8487,
  "mid;": 8739,
  "nGg;": 8921,
  "nGt;": 8811,
  "nLl;": 8920,
  "nLt;": 8810,
  "nap;": 8777,
  nbsp: 160,
  "ncy;": 1085,
  "nfr;": 120107,
  "ngE;": 8807,
  "nge;": 8817,
  "ngt;": 8815,
  "nis;": 8956,
  "niv;": 8715,
  "nlE;": 8806,
  "nle;": 8816,
  "nlt;": 8814,
  "not;": 172,
  "npr;": 8832,
  "nsc;": 8833,
  "num;": 35,
  "ocy;": 1086,
  "ofr;": 120108,
  "ogt;": 10689,
  "ohm;": 937,
  "olt;": 10688,
  "ord;": 10845,
  ordf: 170,
  ordm: 186,
  "orv;": 10843,
  ouml: 246,
  "par;": 8741,
  para: 182,
  "pcy;": 1087,
  "pfr;": 120109,
  "phi;": 966,
  "piv;": 982,
  "prE;": 10931,
  "pre;": 10927,
  "psi;": 968,
  "qfr;": 120110,
  quot: 34,
  "rcy;": 1088,
  "reg;": 174,
  "rfr;": 120111,
  "rho;": 961,
  "rlm;": 8207,
  "rsh;": 8625,
  "scE;": 10932,
  "sce;": 10928,
  "scy;": 1089,
  sect: 167,
  "sfr;": 120112,
  "shy;": 173,
  "sim;": 8764,
  "smt;": 10922,
  "sol;": 47,
  "squ;": 9633,
  "sub;": 8834,
  "sum;": 8721,
  sup1: 185,
  sup2: 178,
  sup3: 179,
  "sup;": 8835,
  "tau;": 964,
  "tcy;": 1090,
  "tfr;": 120113,
  "top;": 8868,
  "ucy;": 1091,
  "ufr;": 120114,
  "uml;": 168,
  uuml: 252,
  "vcy;": 1074,
  "vee;": 8744,
  "vfr;": 120115,
  "wfr;": 120116,
  "xfr;": 120117,
  "ycy;": 1099,
  "yen;": 165,
  "yfr;": 120118,
  yuml: 255,
  "zcy;": 1079,
  "zfr;": 120119,
  "zwj;": 8205,
  AMP: 38,
  "DD;": 8517,
  ETH: 208,
  "GT;": 62,
  "Gg;": 8921,
  "Gt;": 8811,
  "Im;": 8465,
  "LT;": 60,
  "Ll;": 8920,
  "Lt;": 8810,
  "Mu;": 924,
  "Nu;": 925,
  "Or;": 10836,
  "Pi;": 928,
  "Pr;": 10939,
  REG: 174,
  "Re;": 8476,
  "Sc;": 10940,
  "Xi;": 926,
  "ac;": 8766,
  "af;": 8289,
  amp: 38,
  "ap;": 8776,
  "dd;": 8518,
  deg: 176,
  "ee;": 8519,
  "eg;": 10906,
  "el;": 10905,
  eth: 240,
  "gE;": 8807,
  "ge;": 8805,
  "gg;": 8811,
  "gl;": 8823,
  "gt;": 62,
  "ic;": 8291,
  "ii;": 8520,
  "in;": 8712,
  "it;": 8290,
  "lE;": 8806,
  "le;": 8804,
  "lg;": 8822,
  "ll;": 8810,
  "lt;": 60,
  "mp;": 8723,
  "mu;": 956,
  "ne;": 8800,
  "ni;": 8715,
  not: 172,
  "nu;": 957,
  "oS;": 9416,
  "or;": 8744,
  "pi;": 960,
  "pm;": 177,
  "pr;": 8826,
  reg: 174,
  "rx;": 8478,
  "sc;": 8827,
  shy: 173,
  uml: 168,
  "wp;": 8472,
  "wr;": 8768,
  "xi;": 958,
  yen: 165,
  GT: 62,
  LT: 60,
  gt: 62,
  lt: 60
};
function reg_exp_entity(entity_name, is_attribute_value) {
  if (is_attribute_value && !entity_name.endsWith(";")) {
    return `${entity_name}\\b(?!=)`;
  }
  return entity_name;
}
function get_entity_pattern(is_attribute_value) {
  const reg_exp_num = "#(?:x[a-fA-F\\d]+|\\d+)(?:;)?";
  const reg_exp_entities = Object.keys(entities).map(
    /** @param {any} entity_name */
    (entity_name) => reg_exp_entity(entity_name, is_attribute_value)
  );
  const entity_pattern = new RegExp(`&(${reg_exp_num}|${reg_exp_entities.join("|")})`, "g");
  return entity_pattern;
}
get_entity_pattern(false);
get_entity_pattern(true);
const root_only_meta_tags = /* @__PURE__ */ new Map([
  ["svelte:head", "SvelteHead"],
  ["svelte:options", "SvelteOptions"],
  ["svelte:window", "SvelteWindow"],
  ["svelte:document", "SvelteDocument"],
  ["svelte:body", "SvelteBody"]
]);
new Map([
  ...root_only_meta_tags,
  ["svelte:element", "SvelteElement"],
  ["svelte:component", "SvelteComponent"],
  ["svelte:self", "SvelteSelf"],
  ["svelte:fragment", "SvelteFragment"]
]);
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
var lib$1 = {};
var ariaPropsMap$1 = {};
var iterationDecorator$3 = {};
var iteratorProxy$3 = {};
Object.defineProperty(iteratorProxy$3, "__esModule", {
  value: true
});
iteratorProxy$3.default = void 0;
function iteratorProxy$2() {
  var values10 = this;
  var index2 = 0;
  var iter = {
    "@@iterator": function iterator() {
      return iter;
    },
    next: function next() {
      if (index2 < values10.length) {
        var value = values10[index2];
        index2 = index2 + 1;
        return {
          done: false,
          value
        };
      } else {
        return {
          done: true
        };
      }
    }
  };
  return iter;
}
iteratorProxy$3.default = iteratorProxy$2;
Object.defineProperty(iterationDecorator$3, "__esModule", {
  value: true
});
iterationDecorator$3.default = iterationDecorator$2;
var _iteratorProxy$1 = _interopRequireDefault$g(iteratorProxy$3);
function _interopRequireDefault$g(e2) {
  return e2 && e2.__esModule ? e2 : { default: e2 };
}
function _typeof$1(o2) {
  "@babel/helpers - typeof";
  return _typeof$1 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o3) {
    return typeof o3;
  } : function(o3) {
    return o3 && "function" == typeof Symbol && o3.constructor === Symbol && o3 !== Symbol.prototype ? "symbol" : typeof o3;
  }, _typeof$1(o2);
}
function iterationDecorator$2(collection, entries10) {
  if (typeof Symbol === "function" && _typeof$1(Symbol.iterator) === "symbol") {
    Object.defineProperty(collection, Symbol.iterator, {
      value: _iteratorProxy$1.default.bind(entries10)
    });
  }
  return collection;
}
Object.defineProperty(ariaPropsMap$1, "__esModule", {
  value: true
});
ariaPropsMap$1.default = void 0;
var _iterationDecorator$8 = _interopRequireDefault$f(iterationDecorator$3);
function _interopRequireDefault$f(e2) {
  return e2 && e2.__esModule ? e2 : { default: e2 };
}
function _slicedToArray$8(r, e2) {
  return _arrayWithHoles$8(r) || _iterableToArrayLimit$8(r, e2) || _unsupportedIterableToArray$8(r, e2) || _nonIterableRest$8();
}
function _nonIterableRest$8() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _unsupportedIterableToArray$8(r, a2) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray$8(r, a2);
    var t2 = {}.toString.call(r).slice(8, -1);
    return "Object" === t2 && r.constructor && (t2 = r.constructor.name), "Map" === t2 || "Set" === t2 ? Array.from(r) : "Arguments" === t2 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t2) ? _arrayLikeToArray$8(r, a2) : void 0;
  }
}
function _arrayLikeToArray$8(r, a2) {
  (null == a2 || a2 > r.length) && (a2 = r.length);
  for (var e2 = 0, n2 = Array(a2); e2 < a2; e2++) n2[e2] = r[e2];
  return n2;
}
function _iterableToArrayLimit$8(r, l2) {
  var t2 = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (null != t2) {
    var e2, n2, i, u2, a2 = [], f2 = true, o2 = false;
    try {
      if (i = (t2 = t2.call(r)).next, 0 === l2) {
        if (Object(t2) !== t2) return;
        f2 = false;
      } else for (; !(f2 = (e2 = i.call(t2)).done) && (a2.push(e2.value), a2.length !== l2); f2 = true) ;
    } catch (r2) {
      o2 = true, n2 = r2;
    } finally {
      try {
        if (!f2 && null != t2.return && (u2 = t2.return(), Object(u2) !== u2)) return;
      } finally {
        if (o2) throw n2;
      }
    }
    return a2;
  }
}
function _arrayWithHoles$8(r) {
  if (Array.isArray(r)) return r;
}
var properties = [["aria-activedescendant", {
  "type": "id"
}], ["aria-atomic", {
  "type": "boolean"
}], ["aria-autocomplete", {
  "type": "token",
  "values": ["inline", "list", "both", "none"]
}], ["aria-braillelabel", {
  "type": "string"
}], ["aria-brailleroledescription", {
  "type": "string"
}], ["aria-busy", {
  "type": "boolean"
}], ["aria-checked", {
  "type": "tristate"
}], ["aria-colcount", {
  type: "integer"
}], ["aria-colindex", {
  type: "integer"
}], ["aria-colspan", {
  type: "integer"
}], ["aria-controls", {
  "type": "idlist"
}], ["aria-current", {
  type: "token",
  values: ["page", "step", "location", "date", "time", true, false]
}], ["aria-describedby", {
  "type": "idlist"
}], ["aria-description", {
  "type": "string"
}], ["aria-details", {
  "type": "id"
}], ["aria-disabled", {
  "type": "boolean"
}], ["aria-dropeffect", {
  "type": "tokenlist",
  "values": ["copy", "execute", "link", "move", "none", "popup"]
}], ["aria-errormessage", {
  "type": "id"
}], ["aria-expanded", {
  "type": "boolean",
  "allowundefined": true
}], ["aria-flowto", {
  "type": "idlist"
}], ["aria-grabbed", {
  "type": "boolean",
  "allowundefined": true
}], ["aria-haspopup", {
  "type": "token",
  "values": [false, true, "menu", "listbox", "tree", "grid", "dialog"]
}], ["aria-hidden", {
  "type": "boolean",
  "allowundefined": true
}], ["aria-invalid", {
  "type": "token",
  "values": ["grammar", false, "spelling", true]
}], ["aria-keyshortcuts", {
  type: "string"
}], ["aria-label", {
  "type": "string"
}], ["aria-labelledby", {
  "type": "idlist"
}], ["aria-level", {
  "type": "integer"
}], ["aria-live", {
  "type": "token",
  "values": ["assertive", "off", "polite"]
}], ["aria-modal", {
  type: "boolean"
}], ["aria-multiline", {
  "type": "boolean"
}], ["aria-multiselectable", {
  "type": "boolean"
}], ["aria-orientation", {
  "type": "token",
  "values": ["vertical", "undefined", "horizontal"]
}], ["aria-owns", {
  "type": "idlist"
}], ["aria-placeholder", {
  type: "string"
}], ["aria-posinset", {
  "type": "integer"
}], ["aria-pressed", {
  "type": "tristate"
}], ["aria-readonly", {
  "type": "boolean"
}], ["aria-relevant", {
  "type": "tokenlist",
  "values": ["additions", "all", "removals", "text"]
}], ["aria-required", {
  "type": "boolean"
}], ["aria-roledescription", {
  type: "string"
}], ["aria-rowcount", {
  type: "integer"
}], ["aria-rowindex", {
  type: "integer"
}], ["aria-rowspan", {
  type: "integer"
}], ["aria-selected", {
  "type": "boolean",
  "allowundefined": true
}], ["aria-setsize", {
  "type": "integer"
}], ["aria-sort", {
  "type": "token",
  "values": ["ascending", "descending", "none", "other"]
}], ["aria-valuemax", {
  "type": "number"
}], ["aria-valuemin", {
  "type": "number"
}], ["aria-valuenow", {
  "type": "number"
}], ["aria-valuetext", {
  "type": "string"
}]];
var ariaPropsMap = {
  entries: function entries() {
    return properties;
  },
  forEach: function forEach(fn) {
    var thisArg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
    for (var _i = 0, _properties = properties; _i < _properties.length; _i++) {
      var _properties$_i = _slicedToArray$8(_properties[_i], 2), key = _properties$_i[0], values10 = _properties$_i[1];
      fn.call(thisArg, values10, key, properties);
    }
  },
  get: function get(key) {
    var item = properties.filter(function(tuple) {
      return tuple[0] === key ? true : false;
    })[0];
    return item && item[1];
  },
  has: function has(key) {
    return !!ariaPropsMap.get(key);
  },
  keys: function keys() {
    return properties.map(function(_ref) {
      var _ref2 = _slicedToArray$8(_ref, 1), key = _ref2[0];
      return key;
    });
  },
  values: function values() {
    return properties.map(function(_ref3) {
      var _ref4 = _slicedToArray$8(_ref3, 2), values10 = _ref4[1];
      return values10;
    });
  }
};
ariaPropsMap$1.default = (0, _iterationDecorator$8.default)(ariaPropsMap, ariaPropsMap.entries());
var domMap$1 = {};
Object.defineProperty(domMap$1, "__esModule", {
  value: true
});
domMap$1.default = void 0;
var _iterationDecorator$7 = _interopRequireDefault$e(iterationDecorator$3);
function _interopRequireDefault$e(e2) {
  return e2 && e2.__esModule ? e2 : { default: e2 };
}
function _slicedToArray$7(r, e2) {
  return _arrayWithHoles$7(r) || _iterableToArrayLimit$7(r, e2) || _unsupportedIterableToArray$7(r, e2) || _nonIterableRest$7();
}
function _nonIterableRest$7() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _unsupportedIterableToArray$7(r, a2) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray$7(r, a2);
    var t2 = {}.toString.call(r).slice(8, -1);
    return "Object" === t2 && r.constructor && (t2 = r.constructor.name), "Map" === t2 || "Set" === t2 ? Array.from(r) : "Arguments" === t2 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t2) ? _arrayLikeToArray$7(r, a2) : void 0;
  }
}
function _arrayLikeToArray$7(r, a2) {
  (null == a2 || a2 > r.length) && (a2 = r.length);
  for (var e2 = 0, n2 = Array(a2); e2 < a2; e2++) n2[e2] = r[e2];
  return n2;
}
function _iterableToArrayLimit$7(r, l2) {
  var t2 = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (null != t2) {
    var e2, n2, i, u2, a2 = [], f2 = true, o2 = false;
    try {
      if (i = (t2 = t2.call(r)).next, 0 === l2) {
        if (Object(t2) !== t2) return;
        f2 = false;
      } else for (; !(f2 = (e2 = i.call(t2)).done) && (a2.push(e2.value), a2.length !== l2); f2 = true) ;
    } catch (r2) {
      o2 = true, n2 = r2;
    } finally {
      try {
        if (!f2 && null != t2.return && (u2 = t2.return(), Object(u2) !== u2)) return;
      } finally {
        if (o2) throw n2;
      }
    }
    return a2;
  }
}
function _arrayWithHoles$7(r) {
  if (Array.isArray(r)) return r;
}
var dom = [["a", {
  reserved: false
}], ["abbr", {
  reserved: false
}], ["acronym", {
  reserved: false
}], ["address", {
  reserved: false
}], ["applet", {
  reserved: false
}], ["area", {
  reserved: false
}], ["article", {
  reserved: false
}], ["aside", {
  reserved: false
}], ["audio", {
  reserved: false
}], ["b", {
  reserved: false
}], ["base", {
  reserved: true
}], ["bdi", {
  reserved: false
}], ["bdo", {
  reserved: false
}], ["big", {
  reserved: false
}], ["blink", {
  reserved: false
}], ["blockquote", {
  reserved: false
}], ["body", {
  reserved: false
}], ["br", {
  reserved: false
}], ["button", {
  reserved: false
}], ["canvas", {
  reserved: false
}], ["caption", {
  reserved: false
}], ["center", {
  reserved: false
}], ["cite", {
  reserved: false
}], ["code", {
  reserved: false
}], ["col", {
  reserved: true
}], ["colgroup", {
  reserved: true
}], ["content", {
  reserved: false
}], ["data", {
  reserved: false
}], ["datalist", {
  reserved: false
}], ["dd", {
  reserved: false
}], ["del", {
  reserved: false
}], ["details", {
  reserved: false
}], ["dfn", {
  reserved: false
}], ["dialog", {
  reserved: false
}], ["dir", {
  reserved: false
}], ["div", {
  reserved: false
}], ["dl", {
  reserved: false
}], ["dt", {
  reserved: false
}], ["em", {
  reserved: false
}], ["embed", {
  reserved: false
}], ["fieldset", {
  reserved: false
}], ["figcaption", {
  reserved: false
}], ["figure", {
  reserved: false
}], ["font", {
  reserved: false
}], ["footer", {
  reserved: false
}], ["form", {
  reserved: false
}], ["frame", {
  reserved: false
}], ["frameset", {
  reserved: false
}], ["h1", {
  reserved: false
}], ["h2", {
  reserved: false
}], ["h3", {
  reserved: false
}], ["h4", {
  reserved: false
}], ["h5", {
  reserved: false
}], ["h6", {
  reserved: false
}], ["head", {
  reserved: true
}], ["header", {
  reserved: false
}], ["hgroup", {
  reserved: false
}], ["hr", {
  reserved: false
}], ["html", {
  reserved: true
}], ["i", {
  reserved: false
}], ["iframe", {
  reserved: false
}], ["img", {
  reserved: false
}], ["input", {
  reserved: false
}], ["ins", {
  reserved: false
}], ["kbd", {
  reserved: false
}], ["keygen", {
  reserved: false
}], ["label", {
  reserved: false
}], ["legend", {
  reserved: false
}], ["li", {
  reserved: false
}], ["link", {
  reserved: true
}], ["main", {
  reserved: false
}], ["map", {
  reserved: false
}], ["mark", {
  reserved: false
}], ["marquee", {
  reserved: false
}], ["menu", {
  reserved: false
}], ["menuitem", {
  reserved: false
}], ["meta", {
  reserved: true
}], ["meter", {
  reserved: false
}], ["nav", {
  reserved: false
}], ["noembed", {
  reserved: true
}], ["noscript", {
  reserved: true
}], ["object", {
  reserved: false
}], ["ol", {
  reserved: false
}], ["optgroup", {
  reserved: false
}], ["option", {
  reserved: false
}], ["output", {
  reserved: false
}], ["p", {
  reserved: false
}], ["param", {
  reserved: true
}], ["picture", {
  reserved: true
}], ["pre", {
  reserved: false
}], ["progress", {
  reserved: false
}], ["q", {
  reserved: false
}], ["rp", {
  reserved: false
}], ["rt", {
  reserved: false
}], ["rtc", {
  reserved: false
}], ["ruby", {
  reserved: false
}], ["s", {
  reserved: false
}], ["samp", {
  reserved: false
}], ["script", {
  reserved: true
}], ["section", {
  reserved: false
}], ["select", {
  reserved: false
}], ["small", {
  reserved: false
}], ["source", {
  reserved: true
}], ["spacer", {
  reserved: false
}], ["span", {
  reserved: false
}], ["strike", {
  reserved: false
}], ["strong", {
  reserved: false
}], ["style", {
  reserved: true
}], ["sub", {
  reserved: false
}], ["summary", {
  reserved: false
}], ["sup", {
  reserved: false
}], ["table", {
  reserved: false
}], ["tbody", {
  reserved: false
}], ["td", {
  reserved: false
}], ["textarea", {
  reserved: false
}], ["tfoot", {
  reserved: false
}], ["th", {
  reserved: false
}], ["thead", {
  reserved: false
}], ["time", {
  reserved: false
}], ["title", {
  reserved: true
}], ["tr", {
  reserved: false
}], ["track", {
  reserved: true
}], ["tt", {
  reserved: false
}], ["u", {
  reserved: false
}], ["ul", {
  reserved: false
}], ["var", {
  reserved: false
}], ["video", {
  reserved: false
}], ["wbr", {
  reserved: false
}], ["xmp", {
  reserved: false
}]];
var domMap = {
  entries: function entries2() {
    return dom;
  },
  forEach: function forEach2(fn) {
    var thisArg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
    for (var _i = 0, _dom = dom; _i < _dom.length; _i++) {
      var _dom$_i = _slicedToArray$7(_dom[_i], 2), key = _dom$_i[0], values10 = _dom$_i[1];
      fn.call(thisArg, values10, key, dom);
    }
  },
  get: function get2(key) {
    var item = dom.filter(function(tuple) {
      return tuple[0] === key ? true : false;
    })[0];
    return item && item[1];
  },
  has: function has2(key) {
    return !!domMap.get(key);
  },
  keys: function keys2() {
    return dom.map(function(_ref) {
      var _ref2 = _slicedToArray$7(_ref, 1), key = _ref2[0];
      return key;
    });
  },
  values: function values2() {
    return dom.map(function(_ref3) {
      var _ref4 = _slicedToArray$7(_ref3, 2), values10 = _ref4[1];
      return values10;
    });
  }
};
domMap$1.default = (0, _iterationDecorator$7.default)(domMap, domMap.entries());
var rolesMap$1 = {};
var ariaAbstractRoles$1 = {};
var commandRole$1 = {};
Object.defineProperty(commandRole$1, "__esModule", {
  value: true
});
commandRole$1.default = void 0;
var commandRole = {
  abstract: true,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "widget"]]
};
commandRole$1.default = commandRole;
var compositeRole$1 = {};
Object.defineProperty(compositeRole$1, "__esModule", {
  value: true
});
compositeRole$1.default = void 0;
var compositeRole = {
  abstract: true,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-activedescendant": null,
    "aria-disabled": null
  },
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "widget"]]
};
compositeRole$1.default = compositeRole;
var inputRole$1 = {};
Object.defineProperty(inputRole$1, "__esModule", {
  value: true
});
inputRole$1.default = void 0;
var inputRole = {
  abstract: true,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null
  },
  relatedConcepts: [{
    concept: {
      name: "input"
    },
    module: "XForms"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "widget"]]
};
inputRole$1.default = inputRole;
var landmarkRole$1 = {};
Object.defineProperty(landmarkRole$1, "__esModule", {
  value: true
});
landmarkRole$1.default = void 0;
var landmarkRole = {
  abstract: true,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
landmarkRole$1.default = landmarkRole;
var rangeRole$1 = {};
Object.defineProperty(rangeRole$1, "__esModule", {
  value: true
});
rangeRole$1.default = void 0;
var rangeRole = {
  abstract: true,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-valuemax": null,
    "aria-valuemin": null,
    "aria-valuenow": null
  },
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure"]]
};
rangeRole$1.default = rangeRole;
var roletypeRole$1 = {};
Object.defineProperty(roletypeRole$1, "__esModule", {
  value: true
});
roletypeRole$1.default = void 0;
var roletypeRole = {
  abstract: true,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: [],
  prohibitedProps: [],
  props: {
    "aria-atomic": null,
    "aria-busy": null,
    "aria-controls": null,
    "aria-current": null,
    "aria-describedby": null,
    "aria-details": null,
    "aria-dropeffect": null,
    "aria-flowto": null,
    "aria-grabbed": null,
    "aria-hidden": null,
    "aria-keyshortcuts": null,
    "aria-label": null,
    "aria-labelledby": null,
    "aria-live": null,
    "aria-owns": null,
    "aria-relevant": null,
    "aria-roledescription": null
  },
  relatedConcepts: [{
    concept: {
      name: "role"
    },
    module: "XHTML"
  }, {
    concept: {
      name: "type"
    },
    module: "Dublin Core"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: []
};
roletypeRole$1.default = roletypeRole;
var sectionRole$1 = {};
Object.defineProperty(sectionRole$1, "__esModule", {
  value: true
});
sectionRole$1.default = void 0;
var sectionRole = {
  abstract: true,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: [],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      name: "frontmatter"
    },
    module: "DTB"
  }, {
    concept: {
      name: "level"
    },
    module: "DTB"
  }, {
    concept: {
      name: "level"
    },
    module: "SMIL"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure"]]
};
sectionRole$1.default = sectionRole;
var sectionheadRole$1 = {};
Object.defineProperty(sectionheadRole$1, "__esModule", {
  value: true
});
sectionheadRole$1.default = void 0;
var sectionheadRole = {
  abstract: true,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author", "contents"],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure"]]
};
sectionheadRole$1.default = sectionheadRole;
var selectRole$1 = {};
Object.defineProperty(selectRole$1, "__esModule", {
  value: true
});
selectRole$1.default = void 0;
var selectRole = {
  abstract: true,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-orientation": null
  },
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "widget", "composite"], ["roletype", "structure", "section", "group"]]
};
selectRole$1.default = selectRole;
var structureRole$1 = {};
Object.defineProperty(structureRole$1, "__esModule", {
  value: true
});
structureRole$1.default = void 0;
var structureRole = {
  abstract: true,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: [],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype"]]
};
structureRole$1.default = structureRole;
var widgetRole$1 = {};
Object.defineProperty(widgetRole$1, "__esModule", {
  value: true
});
widgetRole$1.default = void 0;
var widgetRole = {
  abstract: true,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: [],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype"]]
};
widgetRole$1.default = widgetRole;
var windowRole$1 = {};
Object.defineProperty(windowRole$1, "__esModule", {
  value: true
});
windowRole$1.default = void 0;
var windowRole = {
  abstract: true,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-modal": null
  },
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype"]]
};
windowRole$1.default = windowRole;
Object.defineProperty(ariaAbstractRoles$1, "__esModule", {
  value: true
});
ariaAbstractRoles$1.default = void 0;
var _commandRole = _interopRequireDefault$d(commandRole$1);
var _compositeRole = _interopRequireDefault$d(compositeRole$1);
var _inputRole = _interopRequireDefault$d(inputRole$1);
var _landmarkRole = _interopRequireDefault$d(landmarkRole$1);
var _rangeRole = _interopRequireDefault$d(rangeRole$1);
var _roletypeRole = _interopRequireDefault$d(roletypeRole$1);
var _sectionRole = _interopRequireDefault$d(sectionRole$1);
var _sectionheadRole = _interopRequireDefault$d(sectionheadRole$1);
var _selectRole = _interopRequireDefault$d(selectRole$1);
var _structureRole = _interopRequireDefault$d(structureRole$1);
var _widgetRole = _interopRequireDefault$d(widgetRole$1);
var _windowRole = _interopRequireDefault$d(windowRole$1);
function _interopRequireDefault$d(e2) {
  return e2 && e2.__esModule ? e2 : { default: e2 };
}
var ariaAbstractRoles = [["command", _commandRole.default], ["composite", _compositeRole.default], ["input", _inputRole.default], ["landmark", _landmarkRole.default], ["range", _rangeRole.default], ["roletype", _roletypeRole.default], ["section", _sectionRole.default], ["sectionhead", _sectionheadRole.default], ["select", _selectRole.default], ["structure", _structureRole.default], ["widget", _widgetRole.default], ["window", _windowRole.default]];
ariaAbstractRoles$1.default = ariaAbstractRoles;
var ariaLiteralRoles$1 = {};
var alertRole$1 = {};
Object.defineProperty(alertRole$1, "__esModule", {
  value: true
});
alertRole$1.default = void 0;
var alertRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-atomic": "true",
    "aria-live": "assertive"
  },
  relatedConcepts: [{
    concept: {
      name: "alert"
    },
    module: "XForms"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
alertRole$1.default = alertRole;
var alertdialogRole$1 = {};
Object.defineProperty(alertdialogRole$1, "__esModule", {
  value: true
});
alertdialogRole$1.default = void 0;
var alertdialogRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      name: "alert"
    },
    module: "XForms"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "alert"], ["roletype", "window", "dialog"]]
};
alertdialogRole$1.default = alertdialogRole;
var applicationRole$1 = {};
Object.defineProperty(applicationRole$1, "__esModule", {
  value: true
});
applicationRole$1.default = void 0;
var applicationRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-activedescendant": null,
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "Device Independence Delivery Unit"
    }
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure"]]
};
applicationRole$1.default = applicationRole;
var articleRole$1 = {};
Object.defineProperty(articleRole$1, "__esModule", {
  value: true
});
articleRole$1.default = void 0;
var articleRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-posinset": null,
    "aria-setsize": null
  },
  relatedConcepts: [{
    concept: {
      name: "article"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "document"]]
};
articleRole$1.default = articleRole;
var bannerRole$1 = {};
Object.defineProperty(bannerRole$1, "__esModule", {
  value: true
});
bannerRole$1.default = void 0;
var bannerRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      constraints: ["scoped to the body element"],
      name: "header"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "landmark"]]
};
bannerRole$1.default = bannerRole;
var blockquoteRole$1 = {};
Object.defineProperty(blockquoteRole$1, "__esModule", {
  value: true
});
blockquoteRole$1.default = void 0;
var blockquoteRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      name: "blockquote"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
blockquoteRole$1.default = blockquoteRole;
var buttonRole$1 = {};
Object.defineProperty(buttonRole$1, "__esModule", {
  value: true
});
buttonRole$1.default = void 0;
var buttonRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: true,
  nameFrom: ["author", "contents"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-pressed": null
  },
  relatedConcepts: [{
    concept: {
      attributes: [{
        name: "type",
        value: "button"
      }],
      name: "input"
    },
    module: "HTML"
  }, {
    concept: {
      attributes: [{
        name: "type",
        value: "image"
      }],
      name: "input"
    },
    module: "HTML"
  }, {
    concept: {
      attributes: [{
        name: "type",
        value: "reset"
      }],
      name: "input"
    },
    module: "HTML"
  }, {
    concept: {
      attributes: [{
        name: "type",
        value: "submit"
      }],
      name: "input"
    },
    module: "HTML"
  }, {
    concept: {
      name: "button"
    },
    module: "HTML"
  }, {
    concept: {
      name: "trigger"
    },
    module: "XForms"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "widget", "command"]]
};
buttonRole$1.default = buttonRole;
var captionRole$1 = {};
Object.defineProperty(captionRole$1, "__esModule", {
  value: true
});
captionRole$1.default = void 0;
var captionRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["prohibited"],
  prohibitedProps: ["aria-label", "aria-labelledby"],
  props: {},
  relatedConcepts: [{
    concept: {
      name: "caption"
    },
    module: "HTML"
  }],
  requireContextRole: ["figure", "grid", "table"],
  requiredContextRole: ["figure", "grid", "table"],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
captionRole$1.default = captionRole;
var cellRole$1 = {};
Object.defineProperty(cellRole$1, "__esModule", {
  value: true
});
cellRole$1.default = void 0;
var cellRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author", "contents"],
  prohibitedProps: [],
  props: {
    "aria-colindex": null,
    "aria-colspan": null,
    "aria-rowindex": null,
    "aria-rowspan": null
  },
  relatedConcepts: [{
    concept: {
      constraints: ["ancestor table element has table role"],
      name: "td"
    },
    module: "HTML"
  }],
  requireContextRole: ["row"],
  requiredContextRole: ["row"],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
cellRole$1.default = cellRole;
var checkboxRole$1 = {};
Object.defineProperty(checkboxRole$1, "__esModule", {
  value: true
});
checkboxRole$1.default = void 0;
var checkboxRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: true,
  nameFrom: ["author", "contents"],
  prohibitedProps: [],
  props: {
    "aria-checked": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-invalid": null,
    "aria-readonly": null,
    "aria-required": null
  },
  relatedConcepts: [{
    concept: {
      attributes: [{
        name: "type",
        value: "checkbox"
      }],
      name: "input"
    },
    module: "HTML"
  }, {
    concept: {
      name: "option"
    },
    module: "ARIA"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {
    "aria-checked": null
  },
  superClass: [["roletype", "widget", "input"]]
};
checkboxRole$1.default = checkboxRole;
var codeRole$1 = {};
Object.defineProperty(codeRole$1, "__esModule", {
  value: true
});
codeRole$1.default = void 0;
var codeRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["prohibited"],
  prohibitedProps: ["aria-label", "aria-labelledby"],
  props: {},
  relatedConcepts: [{
    concept: {
      name: "code"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
codeRole$1.default = codeRole;
var columnheaderRole$1 = {};
Object.defineProperty(columnheaderRole$1, "__esModule", {
  value: true
});
columnheaderRole$1.default = void 0;
var columnheaderRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author", "contents"],
  prohibitedProps: [],
  props: {
    "aria-sort": null
  },
  relatedConcepts: [{
    concept: {
      name: "th"
    },
    module: "HTML"
  }, {
    concept: {
      attributes: [{
        name: "scope",
        value: "col"
      }],
      name: "th"
    },
    module: "HTML"
  }, {
    concept: {
      attributes: [{
        name: "scope",
        value: "colgroup"
      }],
      name: "th"
    },
    module: "HTML"
  }],
  requireContextRole: ["row"],
  requiredContextRole: ["row"],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "cell"], ["roletype", "structure", "section", "cell", "gridcell"], ["roletype", "widget", "gridcell"], ["roletype", "structure", "sectionhead"]]
};
columnheaderRole$1.default = columnheaderRole;
var comboboxRole$1 = {};
Object.defineProperty(comboboxRole$1, "__esModule", {
  value: true
});
comboboxRole$1.default = void 0;
var comboboxRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-activedescendant": null,
    "aria-autocomplete": null,
    "aria-errormessage": null,
    "aria-invalid": null,
    "aria-readonly": null,
    "aria-required": null,
    "aria-expanded": "false",
    "aria-haspopup": "listbox"
  },
  relatedConcepts: [{
    concept: {
      attributes: [{
        constraints: ["set"],
        name: "list"
      }, {
        name: "type",
        value: "email"
      }],
      name: "input"
    },
    module: "HTML"
  }, {
    concept: {
      attributes: [{
        constraints: ["set"],
        name: "list"
      }, {
        name: "type",
        value: "search"
      }],
      name: "input"
    },
    module: "HTML"
  }, {
    concept: {
      attributes: [{
        constraints: ["set"],
        name: "list"
      }, {
        name: "type",
        value: "tel"
      }],
      name: "input"
    },
    module: "HTML"
  }, {
    concept: {
      attributes: [{
        constraints: ["set"],
        name: "list"
      }, {
        name: "type",
        value: "text"
      }],
      name: "input"
    },
    module: "HTML"
  }, {
    concept: {
      attributes: [{
        constraints: ["set"],
        name: "list"
      }, {
        name: "type",
        value: "url"
      }],
      name: "input"
    },
    module: "HTML"
  }, {
    concept: {
      attributes: [{
        constraints: ["set"],
        name: "list"
      }, {
        name: "type",
        value: "url"
      }],
      name: "input"
    },
    module: "HTML"
  }, {
    concept: {
      attributes: [{
        constraints: ["undefined"],
        name: "multiple"
      }, {
        constraints: ["undefined"],
        name: "size"
      }],
      constraints: ["the multiple attribute is not set and the size attribute does not have a value greater than 1"],
      name: "select"
    },
    module: "HTML"
  }, {
    concept: {
      name: "select"
    },
    module: "XForms"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {
    "aria-controls": null,
    "aria-expanded": "false"
  },
  superClass: [["roletype", "widget", "input"]]
};
comboboxRole$1.default = comboboxRole;
var complementaryRole$1 = {};
Object.defineProperty(complementaryRole$1, "__esModule", {
  value: true
});
complementaryRole$1.default = void 0;
var complementaryRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      constraints: ["scoped to the body element", "scoped to the main element"],
      name: "aside"
    },
    module: "HTML"
  }, {
    concept: {
      attributes: [{
        constraints: ["set"],
        name: "aria-label"
      }],
      constraints: ["scoped to a sectioning content element", "scoped to a sectioning root element other than body"],
      name: "aside"
    },
    module: "HTML"
  }, {
    concept: {
      attributes: [{
        constraints: ["set"],
        name: "aria-labelledby"
      }],
      constraints: ["scoped to a sectioning content element", "scoped to a sectioning root element other than body"],
      name: "aside"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "landmark"]]
};
complementaryRole$1.default = complementaryRole;
var contentinfoRole$1 = {};
Object.defineProperty(contentinfoRole$1, "__esModule", {
  value: true
});
contentinfoRole$1.default = void 0;
var contentinfoRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      constraints: ["scoped to the body element"],
      name: "footer"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "landmark"]]
};
contentinfoRole$1.default = contentinfoRole;
var definitionRole$1 = {};
Object.defineProperty(definitionRole$1, "__esModule", {
  value: true
});
definitionRole$1.default = void 0;
var definitionRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      name: "dd"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
definitionRole$1.default = definitionRole;
var deletionRole$1 = {};
Object.defineProperty(deletionRole$1, "__esModule", {
  value: true
});
deletionRole$1.default = void 0;
var deletionRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["prohibited"],
  prohibitedProps: ["aria-label", "aria-labelledby"],
  props: {},
  relatedConcepts: [{
    concept: {
      name: "del"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
deletionRole$1.default = deletionRole;
var dialogRole$1 = {};
Object.defineProperty(dialogRole$1, "__esModule", {
  value: true
});
dialogRole$1.default = void 0;
var dialogRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      name: "dialog"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "window"]]
};
dialogRole$1.default = dialogRole;
var directoryRole$1 = {};
Object.defineProperty(directoryRole$1, "__esModule", {
  value: true
});
directoryRole$1.default = void 0;
var directoryRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    module: "DAISY Guide"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "list"]]
};
directoryRole$1.default = directoryRole;
var documentRole$1 = {};
Object.defineProperty(documentRole$1, "__esModule", {
  value: true
});
documentRole$1.default = void 0;
var documentRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      name: "Device Independence Delivery Unit"
    }
  }, {
    concept: {
      name: "html"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure"]]
};
documentRole$1.default = documentRole;
var emphasisRole$1 = {};
Object.defineProperty(emphasisRole$1, "__esModule", {
  value: true
});
emphasisRole$1.default = void 0;
var emphasisRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["prohibited"],
  prohibitedProps: ["aria-label", "aria-labelledby"],
  props: {},
  relatedConcepts: [{
    concept: {
      name: "em"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
emphasisRole$1.default = emphasisRole;
var feedRole$1 = {};
Object.defineProperty(feedRole$1, "__esModule", {
  value: true
});
feedRole$1.default = void 0;
var feedRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [["article"]],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "list"]]
};
feedRole$1.default = feedRole;
var figureRole$1 = {};
Object.defineProperty(figureRole$1, "__esModule", {
  value: true
});
figureRole$1.default = void 0;
var figureRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      name: "figure"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
figureRole$1.default = figureRole;
var formRole$1 = {};
Object.defineProperty(formRole$1, "__esModule", {
  value: true
});
formRole$1.default = void 0;
var formRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      attributes: [{
        constraints: ["set"],
        name: "aria-label"
      }],
      name: "form"
    },
    module: "HTML"
  }, {
    concept: {
      attributes: [{
        constraints: ["set"],
        name: "aria-labelledby"
      }],
      name: "form"
    },
    module: "HTML"
  }, {
    concept: {
      attributes: [{
        constraints: ["set"],
        name: "name"
      }],
      name: "form"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "landmark"]]
};
formRole$1.default = formRole;
var genericRole$1 = {};
Object.defineProperty(genericRole$1, "__esModule", {
  value: true
});
genericRole$1.default = void 0;
var genericRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["prohibited"],
  prohibitedProps: ["aria-label", "aria-labelledby"],
  props: {},
  relatedConcepts: [{
    concept: {
      name: "a"
    },
    module: "HTML"
  }, {
    concept: {
      name: "area"
    },
    module: "HTML"
  }, {
    concept: {
      name: "aside"
    },
    module: "HTML"
  }, {
    concept: {
      name: "b"
    },
    module: "HTML"
  }, {
    concept: {
      name: "bdo"
    },
    module: "HTML"
  }, {
    concept: {
      name: "body"
    },
    module: "HTML"
  }, {
    concept: {
      name: "data"
    },
    module: "HTML"
  }, {
    concept: {
      name: "div"
    },
    module: "HTML"
  }, {
    concept: {
      constraints: ["scoped to the main element", "scoped to a sectioning content element", "scoped to a sectioning root element other than body"],
      name: "footer"
    },
    module: "HTML"
  }, {
    concept: {
      constraints: ["scoped to the main element", "scoped to a sectioning content element", "scoped to a sectioning root element other than body"],
      name: "header"
    },
    module: "HTML"
  }, {
    concept: {
      name: "hgroup"
    },
    module: "HTML"
  }, {
    concept: {
      name: "i"
    },
    module: "HTML"
  }, {
    concept: {
      name: "pre"
    },
    module: "HTML"
  }, {
    concept: {
      name: "q"
    },
    module: "HTML"
  }, {
    concept: {
      name: "samp"
    },
    module: "HTML"
  }, {
    concept: {
      name: "section"
    },
    module: "HTML"
  }, {
    concept: {
      name: "small"
    },
    module: "HTML"
  }, {
    concept: {
      name: "span"
    },
    module: "HTML"
  }, {
    concept: {
      name: "u"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure"]]
};
genericRole$1.default = genericRole;
var gridRole$1 = {};
Object.defineProperty(gridRole$1, "__esModule", {
  value: true
});
gridRole$1.default = void 0;
var gridRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-multiselectable": null,
    "aria-readonly": null
  },
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [["row"], ["row", "rowgroup"]],
  requiredProps: {},
  superClass: [["roletype", "widget", "composite"], ["roletype", "structure", "section", "table"]]
};
gridRole$1.default = gridRole;
var gridcellRole$1 = {};
Object.defineProperty(gridcellRole$1, "__esModule", {
  value: true
});
gridcellRole$1.default = void 0;
var gridcellRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author", "contents"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null,
    "aria-readonly": null,
    "aria-required": null,
    "aria-selected": null
  },
  relatedConcepts: [{
    concept: {
      constraints: ["ancestor table element has grid role", "ancestor table element has treegrid role"],
      name: "td"
    },
    module: "HTML"
  }],
  requireContextRole: ["row"],
  requiredContextRole: ["row"],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "cell"], ["roletype", "widget"]]
};
gridcellRole$1.default = gridcellRole;
var groupRole$1 = {};
Object.defineProperty(groupRole$1, "__esModule", {
  value: true
});
groupRole$1.default = void 0;
var groupRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-activedescendant": null,
    "aria-disabled": null
  },
  relatedConcepts: [{
    concept: {
      name: "details"
    },
    module: "HTML"
  }, {
    concept: {
      name: "fieldset"
    },
    module: "HTML"
  }, {
    concept: {
      name: "optgroup"
    },
    module: "HTML"
  }, {
    concept: {
      name: "address"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
groupRole$1.default = groupRole;
var headingRole$1 = {};
Object.defineProperty(headingRole$1, "__esModule", {
  value: true
});
headingRole$1.default = void 0;
var headingRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author", "contents"],
  prohibitedProps: [],
  props: {
    "aria-level": "2"
  },
  relatedConcepts: [{
    concept: {
      name: "h1"
    },
    module: "HTML"
  }, {
    concept: {
      name: "h2"
    },
    module: "HTML"
  }, {
    concept: {
      name: "h3"
    },
    module: "HTML"
  }, {
    concept: {
      name: "h4"
    },
    module: "HTML"
  }, {
    concept: {
      name: "h5"
    },
    module: "HTML"
  }, {
    concept: {
      name: "h6"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {
    "aria-level": "2"
  },
  superClass: [["roletype", "structure", "sectionhead"]]
};
headingRole$1.default = headingRole;
var imgRole$1 = {};
Object.defineProperty(imgRole$1, "__esModule", {
  value: true
});
imgRole$1.default = void 0;
var imgRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: true,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      attributes: [{
        constraints: ["set"],
        name: "alt"
      }],
      name: "img"
    },
    module: "HTML"
  }, {
    concept: {
      attributes: [{
        constraints: ["undefined"],
        name: "alt"
      }],
      name: "img"
    },
    module: "HTML"
  }, {
    concept: {
      name: "imggroup"
    },
    module: "DTB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
imgRole$1.default = imgRole;
var insertionRole$1 = {};
Object.defineProperty(insertionRole$1, "__esModule", {
  value: true
});
insertionRole$1.default = void 0;
var insertionRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["prohibited"],
  prohibitedProps: ["aria-label", "aria-labelledby"],
  props: {},
  relatedConcepts: [{
    concept: {
      name: "ins"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
insertionRole$1.default = insertionRole;
var linkRole$1 = {};
Object.defineProperty(linkRole$1, "__esModule", {
  value: true
});
linkRole$1.default = void 0;
var linkRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author", "contents"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-expanded": null,
    "aria-haspopup": null
  },
  relatedConcepts: [{
    concept: {
      attributes: [{
        constraints: ["set"],
        name: "href"
      }],
      name: "a"
    },
    module: "HTML"
  }, {
    concept: {
      attributes: [{
        constraints: ["set"],
        name: "href"
      }],
      name: "area"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "widget", "command"]]
};
linkRole$1.default = linkRole;
var listRole$1 = {};
Object.defineProperty(listRole$1, "__esModule", {
  value: true
});
listRole$1.default = void 0;
var listRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      name: "menu"
    },
    module: "HTML"
  }, {
    concept: {
      name: "ol"
    },
    module: "HTML"
  }, {
    concept: {
      name: "ul"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [["listitem"]],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
listRole$1.default = listRole;
var listboxRole$1 = {};
Object.defineProperty(listboxRole$1, "__esModule", {
  value: true
});
listboxRole$1.default = void 0;
var listboxRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-invalid": null,
    "aria-multiselectable": null,
    "aria-readonly": null,
    "aria-required": null,
    "aria-orientation": "vertical"
  },
  relatedConcepts: [{
    concept: {
      attributes: [{
        constraints: [">1"],
        name: "size"
      }],
      constraints: ["the size attribute value is greater than 1"],
      name: "select"
    },
    module: "HTML"
  }, {
    concept: {
      attributes: [{
        name: "multiple"
      }],
      name: "select"
    },
    module: "HTML"
  }, {
    concept: {
      name: "datalist"
    },
    module: "HTML"
  }, {
    concept: {
      name: "list"
    },
    module: "ARIA"
  }, {
    concept: {
      name: "select"
    },
    module: "XForms"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [["option", "group"], ["option"]],
  requiredProps: {},
  superClass: [["roletype", "widget", "composite", "select"], ["roletype", "structure", "section", "group", "select"]]
};
listboxRole$1.default = listboxRole;
var listitemRole$1 = {};
Object.defineProperty(listitemRole$1, "__esModule", {
  value: true
});
listitemRole$1.default = void 0;
var listitemRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-level": null,
    "aria-posinset": null,
    "aria-setsize": null
  },
  relatedConcepts: [{
    concept: {
      constraints: ["direct descendant of ol", "direct descendant of ul", "direct descendant of menu"],
      name: "li"
    },
    module: "HTML"
  }, {
    concept: {
      name: "item"
    },
    module: "XForms"
  }],
  requireContextRole: ["directory", "list"],
  requiredContextRole: ["directory", "list"],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
listitemRole$1.default = listitemRole;
var logRole$1 = {};
Object.defineProperty(logRole$1, "__esModule", {
  value: true
});
logRole$1.default = void 0;
var logRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-live": "polite"
  },
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
logRole$1.default = logRole;
var mainRole$1 = {};
Object.defineProperty(mainRole$1, "__esModule", {
  value: true
});
mainRole$1.default = void 0;
var mainRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      name: "main"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "landmark"]]
};
mainRole$1.default = mainRole;
var markRole$1 = {};
Object.defineProperty(markRole$1, "__esModule", {
  value: true
});
markRole$1.default = void 0;
var markRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["prohibited"],
  prohibitedProps: [],
  props: {
    "aria-braillelabel": null,
    "aria-brailleroledescription": null,
    "aria-description": null
  },
  relatedConcepts: [{
    concept: {
      name: "mark"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
markRole$1.default = markRole;
var marqueeRole$1 = {};
Object.defineProperty(marqueeRole$1, "__esModule", {
  value: true
});
marqueeRole$1.default = void 0;
var marqueeRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
marqueeRole$1.default = marqueeRole;
var mathRole$1 = {};
Object.defineProperty(mathRole$1, "__esModule", {
  value: true
});
mathRole$1.default = void 0;
var mathRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      name: "math"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
mathRole$1.default = mathRole;
var menuRole$1 = {};
Object.defineProperty(menuRole$1, "__esModule", {
  value: true
});
menuRole$1.default = void 0;
var menuRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-orientation": "vertical"
  },
  relatedConcepts: [{
    concept: {
      name: "MENU"
    },
    module: "JAPI"
  }, {
    concept: {
      name: "list"
    },
    module: "ARIA"
  }, {
    concept: {
      name: "select"
    },
    module: "XForms"
  }, {
    concept: {
      name: "sidebar"
    },
    module: "DTB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [["menuitem", "group"], ["menuitemradio", "group"], ["menuitemcheckbox", "group"], ["menuitem"], ["menuitemcheckbox"], ["menuitemradio"]],
  requiredProps: {},
  superClass: [["roletype", "widget", "composite", "select"], ["roletype", "structure", "section", "group", "select"]]
};
menuRole$1.default = menuRole;
var menubarRole$1 = {};
Object.defineProperty(menubarRole$1, "__esModule", {
  value: true
});
menubarRole$1.default = void 0;
var menubarRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-orientation": "horizontal"
  },
  relatedConcepts: [{
    concept: {
      name: "toolbar"
    },
    module: "ARIA"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [["menuitem", "group"], ["menuitemradio", "group"], ["menuitemcheckbox", "group"], ["menuitem"], ["menuitemcheckbox"], ["menuitemradio"]],
  requiredProps: {},
  superClass: [["roletype", "widget", "composite", "select", "menu"], ["roletype", "structure", "section", "group", "select", "menu"]]
};
menubarRole$1.default = menubarRole;
var menuitemRole$1 = {};
Object.defineProperty(menuitemRole$1, "__esModule", {
  value: true
});
menuitemRole$1.default = void 0;
var menuitemRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author", "contents"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-posinset": null,
    "aria-setsize": null
  },
  relatedConcepts: [{
    concept: {
      name: "MENU_ITEM"
    },
    module: "JAPI"
  }, {
    concept: {
      name: "listitem"
    },
    module: "ARIA"
  }, {
    concept: {
      name: "option"
    },
    module: "ARIA"
  }],
  requireContextRole: ["group", "menu", "menubar"],
  requiredContextRole: ["group", "menu", "menubar"],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "widget", "command"]]
};
menuitemRole$1.default = menuitemRole;
var menuitemcheckboxRole$1 = {};
Object.defineProperty(menuitemcheckboxRole$1, "__esModule", {
  value: true
});
menuitemcheckboxRole$1.default = void 0;
var menuitemcheckboxRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: true,
  nameFrom: ["author", "contents"],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      name: "menuitem"
    },
    module: "ARIA"
  }],
  requireContextRole: ["group", "menu", "menubar"],
  requiredContextRole: ["group", "menu", "menubar"],
  requiredOwnedElements: [],
  requiredProps: {
    "aria-checked": null
  },
  superClass: [["roletype", "widget", "input", "checkbox"], ["roletype", "widget", "command", "menuitem"]]
};
menuitemcheckboxRole$1.default = menuitemcheckboxRole;
var menuitemradioRole$1 = {};
Object.defineProperty(menuitemradioRole$1, "__esModule", {
  value: true
});
menuitemradioRole$1.default = void 0;
var menuitemradioRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: true,
  nameFrom: ["author", "contents"],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      name: "menuitem"
    },
    module: "ARIA"
  }],
  requireContextRole: ["group", "menu", "menubar"],
  requiredContextRole: ["group", "menu", "menubar"],
  requiredOwnedElements: [],
  requiredProps: {
    "aria-checked": null
  },
  superClass: [["roletype", "widget", "input", "checkbox", "menuitemcheckbox"], ["roletype", "widget", "command", "menuitem", "menuitemcheckbox"], ["roletype", "widget", "input", "radio"]]
};
menuitemradioRole$1.default = menuitemradioRole;
var meterRole$1 = {};
Object.defineProperty(meterRole$1, "__esModule", {
  value: true
});
meterRole$1.default = void 0;
var meterRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: true,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-valuetext": null,
    "aria-valuemax": "100",
    "aria-valuemin": "0"
  },
  relatedConcepts: [{
    concept: {
      name: "meter"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {
    "aria-valuenow": null
  },
  superClass: [["roletype", "structure", "range"]]
};
meterRole$1.default = meterRole;
var navigationRole$1 = {};
Object.defineProperty(navigationRole$1, "__esModule", {
  value: true
});
navigationRole$1.default = void 0;
var navigationRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      name: "nav"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "landmark"]]
};
navigationRole$1.default = navigationRole;
var noneRole$1 = {};
Object.defineProperty(noneRole$1, "__esModule", {
  value: true
});
noneRole$1.default = void 0;
var noneRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: [],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: []
};
noneRole$1.default = noneRole;
var noteRole$1 = {};
Object.defineProperty(noteRole$1, "__esModule", {
  value: true
});
noteRole$1.default = void 0;
var noteRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
noteRole$1.default = noteRole;
var optionRole$1 = {};
Object.defineProperty(optionRole$1, "__esModule", {
  value: true
});
optionRole$1.default = void 0;
var optionRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: true,
  nameFrom: ["author", "contents"],
  prohibitedProps: [],
  props: {
    "aria-checked": null,
    "aria-posinset": null,
    "aria-setsize": null,
    "aria-selected": "false"
  },
  relatedConcepts: [{
    concept: {
      name: "item"
    },
    module: "XForms"
  }, {
    concept: {
      name: "listitem"
    },
    module: "ARIA"
  }, {
    concept: {
      name: "option"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {
    "aria-selected": "false"
  },
  superClass: [["roletype", "widget", "input"]]
};
optionRole$1.default = optionRole;
var paragraphRole$1 = {};
Object.defineProperty(paragraphRole$1, "__esModule", {
  value: true
});
paragraphRole$1.default = void 0;
var paragraphRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["prohibited"],
  prohibitedProps: ["aria-label", "aria-labelledby"],
  props: {},
  relatedConcepts: [{
    concept: {
      name: "p"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
paragraphRole$1.default = paragraphRole;
var presentationRole$1 = {};
Object.defineProperty(presentationRole$1, "__esModule", {
  value: true
});
presentationRole$1.default = void 0;
var presentationRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["prohibited"],
  prohibitedProps: ["aria-label", "aria-labelledby"],
  props: {},
  relatedConcepts: [{
    concept: {
      attributes: [{
        name: "alt",
        value: ""
      }],
      name: "img"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure"]]
};
presentationRole$1.default = presentationRole;
var progressbarRole$1 = {};
Object.defineProperty(progressbarRole$1, "__esModule", {
  value: true
});
progressbarRole$1.default = void 0;
var progressbarRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: true,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-valuetext": null
  },
  relatedConcepts: [{
    concept: {
      name: "progress"
    },
    module: "HTML"
  }, {
    concept: {
      name: "status"
    },
    module: "ARIA"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "range"], ["roletype", "widget"]]
};
progressbarRole$1.default = progressbarRole;
var radioRole$1 = {};
Object.defineProperty(radioRole$1, "__esModule", {
  value: true
});
radioRole$1.default = void 0;
var radioRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: true,
  nameFrom: ["author", "contents"],
  prohibitedProps: [],
  props: {
    "aria-checked": null,
    "aria-posinset": null,
    "aria-setsize": null
  },
  relatedConcepts: [{
    concept: {
      attributes: [{
        name: "type",
        value: "radio"
      }],
      name: "input"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {
    "aria-checked": null
  },
  superClass: [["roletype", "widget", "input"]]
};
radioRole$1.default = radioRole;
var radiogroupRole$1 = {};
Object.defineProperty(radiogroupRole$1, "__esModule", {
  value: true
});
radiogroupRole$1.default = void 0;
var radiogroupRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-errormessage": null,
    "aria-invalid": null,
    "aria-readonly": null,
    "aria-required": null
  },
  relatedConcepts: [{
    concept: {
      name: "list"
    },
    module: "ARIA"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [["radio"]],
  requiredProps: {},
  superClass: [["roletype", "widget", "composite", "select"], ["roletype", "structure", "section", "group", "select"]]
};
radiogroupRole$1.default = radiogroupRole;
var regionRole$1 = {};
Object.defineProperty(regionRole$1, "__esModule", {
  value: true
});
regionRole$1.default = void 0;
var regionRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      attributes: [{
        constraints: ["set"],
        name: "aria-label"
      }],
      name: "section"
    },
    module: "HTML"
  }, {
    concept: {
      attributes: [{
        constraints: ["set"],
        name: "aria-labelledby"
      }],
      name: "section"
    },
    module: "HTML"
  }, {
    concept: {
      name: "Device Independence Glossart perceivable unit"
    }
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "landmark"]]
};
regionRole$1.default = regionRole;
var rowRole$1 = {};
Object.defineProperty(rowRole$1, "__esModule", {
  value: true
});
rowRole$1.default = void 0;
var rowRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author", "contents"],
  prohibitedProps: [],
  props: {
    "aria-colindex": null,
    "aria-expanded": null,
    "aria-level": null,
    "aria-posinset": null,
    "aria-rowindex": null,
    "aria-selected": null,
    "aria-setsize": null
  },
  relatedConcepts: [{
    concept: {
      name: "tr"
    },
    module: "HTML"
  }],
  requireContextRole: ["grid", "rowgroup", "table", "treegrid"],
  requiredContextRole: ["grid", "rowgroup", "table", "treegrid"],
  requiredOwnedElements: [["cell"], ["columnheader"], ["gridcell"], ["rowheader"]],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "group"], ["roletype", "widget"]]
};
rowRole$1.default = rowRole;
var rowgroupRole$1 = {};
Object.defineProperty(rowgroupRole$1, "__esModule", {
  value: true
});
rowgroupRole$1.default = void 0;
var rowgroupRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author", "contents"],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      name: "tbody"
    },
    module: "HTML"
  }, {
    concept: {
      name: "tfoot"
    },
    module: "HTML"
  }, {
    concept: {
      name: "thead"
    },
    module: "HTML"
  }],
  requireContextRole: ["grid", "table", "treegrid"],
  requiredContextRole: ["grid", "table", "treegrid"],
  requiredOwnedElements: [["row"]],
  requiredProps: {},
  superClass: [["roletype", "structure"]]
};
rowgroupRole$1.default = rowgroupRole;
var rowheaderRole$1 = {};
Object.defineProperty(rowheaderRole$1, "__esModule", {
  value: true
});
rowheaderRole$1.default = void 0;
var rowheaderRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author", "contents"],
  prohibitedProps: [],
  props: {
    "aria-sort": null
  },
  relatedConcepts: [{
    concept: {
      attributes: [{
        name: "scope",
        value: "row"
      }],
      name: "th"
    },
    module: "HTML"
  }, {
    concept: {
      attributes: [{
        name: "scope",
        value: "rowgroup"
      }],
      name: "th"
    },
    module: "HTML"
  }],
  requireContextRole: ["row", "rowgroup"],
  requiredContextRole: ["row", "rowgroup"],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "cell"], ["roletype", "structure", "section", "cell", "gridcell"], ["roletype", "widget", "gridcell"], ["roletype", "structure", "sectionhead"]]
};
rowheaderRole$1.default = rowheaderRole;
var scrollbarRole$1 = {};
Object.defineProperty(scrollbarRole$1, "__esModule", {
  value: true
});
scrollbarRole$1.default = void 0;
var scrollbarRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: true,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-valuetext": null,
    "aria-orientation": "vertical",
    "aria-valuemax": "100",
    "aria-valuemin": "0"
  },
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {
    "aria-controls": null,
    "aria-valuenow": null
  },
  superClass: [["roletype", "structure", "range"], ["roletype", "widget"]]
};
scrollbarRole$1.default = scrollbarRole;
var searchRole$1 = {};
Object.defineProperty(searchRole$1, "__esModule", {
  value: true
});
searchRole$1.default = void 0;
var searchRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "landmark"]]
};
searchRole$1.default = searchRole;
var searchboxRole$1 = {};
Object.defineProperty(searchboxRole$1, "__esModule", {
  value: true
});
searchboxRole$1.default = void 0;
var searchboxRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      attributes: [{
        constraints: ["undefined"],
        name: "list"
      }, {
        name: "type",
        value: "search"
      }],
      constraints: ["the list attribute is not set"],
      name: "input"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "widget", "input", "textbox"]]
};
searchboxRole$1.default = searchboxRole;
var separatorRole$1 = {};
Object.defineProperty(separatorRole$1, "__esModule", {
  value: true
});
separatorRole$1.default = void 0;
var separatorRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: true,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-orientation": "horizontal",
    "aria-valuemax": "100",
    "aria-valuemin": "0",
    "aria-valuenow": null,
    "aria-valuetext": null
  },
  relatedConcepts: [{
    concept: {
      name: "hr"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure"]]
};
separatorRole$1.default = separatorRole;
var sliderRole$1 = {};
Object.defineProperty(sliderRole$1, "__esModule", {
  value: true
});
sliderRole$1.default = void 0;
var sliderRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: true,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-errormessage": null,
    "aria-haspopup": null,
    "aria-invalid": null,
    "aria-readonly": null,
    "aria-valuetext": null,
    "aria-orientation": "horizontal",
    "aria-valuemax": "100",
    "aria-valuemin": "0"
  },
  relatedConcepts: [{
    concept: {
      attributes: [{
        name: "type",
        value: "range"
      }],
      name: "input"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {
    "aria-valuenow": null
  },
  superClass: [["roletype", "widget", "input"], ["roletype", "structure", "range"]]
};
sliderRole$1.default = sliderRole;
var spinbuttonRole$1 = {};
Object.defineProperty(spinbuttonRole$1, "__esModule", {
  value: true
});
spinbuttonRole$1.default = void 0;
var spinbuttonRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-errormessage": null,
    "aria-invalid": null,
    "aria-readonly": null,
    "aria-required": null,
    "aria-valuetext": null,
    "aria-valuenow": "0"
  },
  relatedConcepts: [{
    concept: {
      attributes: [{
        name: "type",
        value: "number"
      }],
      name: "input"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "widget", "composite"], ["roletype", "widget", "input"], ["roletype", "structure", "range"]]
};
spinbuttonRole$1.default = spinbuttonRole;
var statusRole$1 = {};
Object.defineProperty(statusRole$1, "__esModule", {
  value: true
});
statusRole$1.default = void 0;
var statusRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-atomic": "true",
    "aria-live": "polite"
  },
  relatedConcepts: [{
    concept: {
      name: "output"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
statusRole$1.default = statusRole;
var strongRole$1 = {};
Object.defineProperty(strongRole$1, "__esModule", {
  value: true
});
strongRole$1.default = void 0;
var strongRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["prohibited"],
  prohibitedProps: ["aria-label", "aria-labelledby"],
  props: {},
  relatedConcepts: [{
    concept: {
      name: "strong"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
strongRole$1.default = strongRole;
var subscriptRole$1 = {};
Object.defineProperty(subscriptRole$1, "__esModule", {
  value: true
});
subscriptRole$1.default = void 0;
var subscriptRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["prohibited"],
  prohibitedProps: ["aria-label", "aria-labelledby"],
  props: {},
  relatedConcepts: [{
    concept: {
      name: "sub"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
subscriptRole$1.default = subscriptRole;
var superscriptRole$1 = {};
Object.defineProperty(superscriptRole$1, "__esModule", {
  value: true
});
superscriptRole$1.default = void 0;
var superscriptRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["prohibited"],
  prohibitedProps: ["aria-label", "aria-labelledby"],
  props: {},
  relatedConcepts: [{
    concept: {
      name: "sup"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
superscriptRole$1.default = superscriptRole;
var switchRole$1 = {};
Object.defineProperty(switchRole$1, "__esModule", {
  value: true
});
switchRole$1.default = void 0;
var switchRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: true,
  nameFrom: ["author", "contents"],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      name: "button"
    },
    module: "ARIA"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {
    "aria-checked": null
  },
  superClass: [["roletype", "widget", "input", "checkbox"]]
};
switchRole$1.default = switchRole;
var tabRole$1 = {};
Object.defineProperty(tabRole$1, "__esModule", {
  value: true
});
tabRole$1.default = void 0;
var tabRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: true,
  nameFrom: ["author", "contents"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-posinset": null,
    "aria-setsize": null,
    "aria-selected": "false"
  },
  relatedConcepts: [],
  requireContextRole: ["tablist"],
  requiredContextRole: ["tablist"],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "sectionhead"], ["roletype", "widget"]]
};
tabRole$1.default = tabRole;
var tableRole$1 = {};
Object.defineProperty(tableRole$1, "__esModule", {
  value: true
});
tableRole$1.default = void 0;
var tableRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-colcount": null,
    "aria-rowcount": null
  },
  relatedConcepts: [{
    concept: {
      name: "table"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [["row"], ["row", "rowgroup"]],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
tableRole$1.default = tableRole;
var tablistRole$1 = {};
Object.defineProperty(tablistRole$1, "__esModule", {
  value: true
});
tablistRole$1.default = void 0;
var tablistRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-level": null,
    "aria-multiselectable": null,
    "aria-orientation": "horizontal"
  },
  relatedConcepts: [{
    module: "DAISY",
    concept: {
      name: "guide"
    }
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [["tab"]],
  requiredProps: {},
  superClass: [["roletype", "widget", "composite"]]
};
tablistRole$1.default = tablistRole;
var tabpanelRole$1 = {};
Object.defineProperty(tabpanelRole$1, "__esModule", {
  value: true
});
tabpanelRole$1.default = void 0;
var tabpanelRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
tabpanelRole$1.default = tabpanelRole;
var termRole$1 = {};
Object.defineProperty(termRole$1, "__esModule", {
  value: true
});
termRole$1.default = void 0;
var termRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      name: "dfn"
    },
    module: "HTML"
  }, {
    concept: {
      name: "dt"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
termRole$1.default = termRole;
var textboxRole$1 = {};
Object.defineProperty(textboxRole$1, "__esModule", {
  value: true
});
textboxRole$1.default = void 0;
var textboxRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-activedescendant": null,
    "aria-autocomplete": null,
    "aria-errormessage": null,
    "aria-haspopup": null,
    "aria-invalid": null,
    "aria-multiline": null,
    "aria-placeholder": null,
    "aria-readonly": null,
    "aria-required": null
  },
  relatedConcepts: [{
    concept: {
      attributes: [{
        constraints: ["undefined"],
        name: "type"
      }, {
        constraints: ["undefined"],
        name: "list"
      }],
      constraints: ["the list attribute is not set"],
      name: "input"
    },
    module: "HTML"
  }, {
    concept: {
      attributes: [{
        constraints: ["undefined"],
        name: "list"
      }, {
        name: "type",
        value: "email"
      }],
      constraints: ["the list attribute is not set"],
      name: "input"
    },
    module: "HTML"
  }, {
    concept: {
      attributes: [{
        constraints: ["undefined"],
        name: "list"
      }, {
        name: "type",
        value: "tel"
      }],
      constraints: ["the list attribute is not set"],
      name: "input"
    },
    module: "HTML"
  }, {
    concept: {
      attributes: [{
        constraints: ["undefined"],
        name: "list"
      }, {
        name: "type",
        value: "text"
      }],
      constraints: ["the list attribute is not set"],
      name: "input"
    },
    module: "HTML"
  }, {
    concept: {
      attributes: [{
        constraints: ["undefined"],
        name: "list"
      }, {
        name: "type",
        value: "url"
      }],
      constraints: ["the list attribute is not set"],
      name: "input"
    },
    module: "HTML"
  }, {
    concept: {
      name: "input"
    },
    module: "XForms"
  }, {
    concept: {
      name: "textarea"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "widget", "input"]]
};
textboxRole$1.default = textboxRole;
var timeRole$1 = {};
Object.defineProperty(timeRole$1, "__esModule", {
  value: true
});
timeRole$1.default = void 0;
var timeRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      name: "time"
    },
    module: "HTML"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
timeRole$1.default = timeRole;
var timerRole$1 = {};
Object.defineProperty(timerRole$1, "__esModule", {
  value: true
});
timerRole$1.default = void 0;
var timerRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "status"]]
};
timerRole$1.default = timerRole;
var toolbarRole$1 = {};
Object.defineProperty(toolbarRole$1, "__esModule", {
  value: true
});
toolbarRole$1.default = void 0;
var toolbarRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-orientation": "horizontal"
  },
  relatedConcepts: [{
    concept: {
      name: "menubar"
    },
    module: "ARIA"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "group"]]
};
toolbarRole$1.default = toolbarRole;
var tooltipRole$1 = {};
Object.defineProperty(tooltipRole$1, "__esModule", {
  value: true
});
tooltipRole$1.default = void 0;
var tooltipRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author", "contents"],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
tooltipRole$1.default = tooltipRole;
var treeRole$1 = {};
Object.defineProperty(treeRole$1, "__esModule", {
  value: true
});
treeRole$1.default = void 0;
var treeRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-errormessage": null,
    "aria-invalid": null,
    "aria-multiselectable": null,
    "aria-required": null,
    "aria-orientation": "vertical"
  },
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [["treeitem", "group"], ["treeitem"]],
  requiredProps: {},
  superClass: [["roletype", "widget", "composite", "select"], ["roletype", "structure", "section", "group", "select"]]
};
treeRole$1.default = treeRole;
var treegridRole$1 = {};
Object.defineProperty(treegridRole$1, "__esModule", {
  value: true
});
treegridRole$1.default = void 0;
var treegridRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [["row"], ["row", "rowgroup"]],
  requiredProps: {},
  superClass: [["roletype", "widget", "composite", "grid"], ["roletype", "structure", "section", "table", "grid"], ["roletype", "widget", "composite", "select", "tree"], ["roletype", "structure", "section", "group", "select", "tree"]]
};
treegridRole$1.default = treegridRole;
var treeitemRole$1 = {};
Object.defineProperty(treeitemRole$1, "__esModule", {
  value: true
});
treeitemRole$1.default = void 0;
var treeitemRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author", "contents"],
  prohibitedProps: [],
  props: {
    "aria-expanded": null,
    "aria-haspopup": null
  },
  relatedConcepts: [],
  requireContextRole: ["group", "tree"],
  requiredContextRole: ["group", "tree"],
  requiredOwnedElements: [],
  requiredProps: {
    "aria-selected": null
  },
  superClass: [["roletype", "structure", "section", "listitem"], ["roletype", "widget", "input", "option"]]
};
treeitemRole$1.default = treeitemRole;
Object.defineProperty(ariaLiteralRoles$1, "__esModule", {
  value: true
});
ariaLiteralRoles$1.default = void 0;
var _alertRole = _interopRequireDefault$c(alertRole$1);
var _alertdialogRole = _interopRequireDefault$c(alertdialogRole$1);
var _applicationRole = _interopRequireDefault$c(applicationRole$1);
var _articleRole = _interopRequireDefault$c(articleRole$1);
var _bannerRole = _interopRequireDefault$c(bannerRole$1);
var _blockquoteRole = _interopRequireDefault$c(blockquoteRole$1);
var _buttonRole = _interopRequireDefault$c(buttonRole$1);
var _captionRole = _interopRequireDefault$c(captionRole$1);
var _cellRole = _interopRequireDefault$c(cellRole$1);
var _checkboxRole = _interopRequireDefault$c(checkboxRole$1);
var _codeRole = _interopRequireDefault$c(codeRole$1);
var _columnheaderRole = _interopRequireDefault$c(columnheaderRole$1);
var _comboboxRole = _interopRequireDefault$c(comboboxRole$1);
var _complementaryRole = _interopRequireDefault$c(complementaryRole$1);
var _contentinfoRole = _interopRequireDefault$c(contentinfoRole$1);
var _definitionRole = _interopRequireDefault$c(definitionRole$1);
var _deletionRole = _interopRequireDefault$c(deletionRole$1);
var _dialogRole = _interopRequireDefault$c(dialogRole$1);
var _directoryRole = _interopRequireDefault$c(directoryRole$1);
var _documentRole = _interopRequireDefault$c(documentRole$1);
var _emphasisRole = _interopRequireDefault$c(emphasisRole$1);
var _feedRole = _interopRequireDefault$c(feedRole$1);
var _figureRole = _interopRequireDefault$c(figureRole$1);
var _formRole = _interopRequireDefault$c(formRole$1);
var _genericRole = _interopRequireDefault$c(genericRole$1);
var _gridRole = _interopRequireDefault$c(gridRole$1);
var _gridcellRole = _interopRequireDefault$c(gridcellRole$1);
var _groupRole = _interopRequireDefault$c(groupRole$1);
var _headingRole = _interopRequireDefault$c(headingRole$1);
var _imgRole = _interopRequireDefault$c(imgRole$1);
var _insertionRole = _interopRequireDefault$c(insertionRole$1);
var _linkRole = _interopRequireDefault$c(linkRole$1);
var _listRole = _interopRequireDefault$c(listRole$1);
var _listboxRole = _interopRequireDefault$c(listboxRole$1);
var _listitemRole = _interopRequireDefault$c(listitemRole$1);
var _logRole = _interopRequireDefault$c(logRole$1);
var _mainRole = _interopRequireDefault$c(mainRole$1);
var _markRole = _interopRequireDefault$c(markRole$1);
var _marqueeRole = _interopRequireDefault$c(marqueeRole$1);
var _mathRole = _interopRequireDefault$c(mathRole$1);
var _menuRole = _interopRequireDefault$c(menuRole$1);
var _menubarRole = _interopRequireDefault$c(menubarRole$1);
var _menuitemRole = _interopRequireDefault$c(menuitemRole$1);
var _menuitemcheckboxRole = _interopRequireDefault$c(menuitemcheckboxRole$1);
var _menuitemradioRole = _interopRequireDefault$c(menuitemradioRole$1);
var _meterRole = _interopRequireDefault$c(meterRole$1);
var _navigationRole = _interopRequireDefault$c(navigationRole$1);
var _noneRole = _interopRequireDefault$c(noneRole$1);
var _noteRole = _interopRequireDefault$c(noteRole$1);
var _optionRole = _interopRequireDefault$c(optionRole$1);
var _paragraphRole = _interopRequireDefault$c(paragraphRole$1);
var _presentationRole = _interopRequireDefault$c(presentationRole$1);
var _progressbarRole = _interopRequireDefault$c(progressbarRole$1);
var _radioRole = _interopRequireDefault$c(radioRole$1);
var _radiogroupRole = _interopRequireDefault$c(radiogroupRole$1);
var _regionRole = _interopRequireDefault$c(regionRole$1);
var _rowRole = _interopRequireDefault$c(rowRole$1);
var _rowgroupRole = _interopRequireDefault$c(rowgroupRole$1);
var _rowheaderRole = _interopRequireDefault$c(rowheaderRole$1);
var _scrollbarRole = _interopRequireDefault$c(scrollbarRole$1);
var _searchRole = _interopRequireDefault$c(searchRole$1);
var _searchboxRole = _interopRequireDefault$c(searchboxRole$1);
var _separatorRole = _interopRequireDefault$c(separatorRole$1);
var _sliderRole = _interopRequireDefault$c(sliderRole$1);
var _spinbuttonRole = _interopRequireDefault$c(spinbuttonRole$1);
var _statusRole = _interopRequireDefault$c(statusRole$1);
var _strongRole = _interopRequireDefault$c(strongRole$1);
var _subscriptRole = _interopRequireDefault$c(subscriptRole$1);
var _superscriptRole = _interopRequireDefault$c(superscriptRole$1);
var _switchRole = _interopRequireDefault$c(switchRole$1);
var _tabRole = _interopRequireDefault$c(tabRole$1);
var _tableRole = _interopRequireDefault$c(tableRole$1);
var _tablistRole = _interopRequireDefault$c(tablistRole$1);
var _tabpanelRole = _interopRequireDefault$c(tabpanelRole$1);
var _termRole = _interopRequireDefault$c(termRole$1);
var _textboxRole = _interopRequireDefault$c(textboxRole$1);
var _timeRole = _interopRequireDefault$c(timeRole$1);
var _timerRole = _interopRequireDefault$c(timerRole$1);
var _toolbarRole = _interopRequireDefault$c(toolbarRole$1);
var _tooltipRole = _interopRequireDefault$c(tooltipRole$1);
var _treeRole = _interopRequireDefault$c(treeRole$1);
var _treegridRole = _interopRequireDefault$c(treegridRole$1);
var _treeitemRole = _interopRequireDefault$c(treeitemRole$1);
function _interopRequireDefault$c(e2) {
  return e2 && e2.__esModule ? e2 : { default: e2 };
}
var ariaLiteralRoles = [["alert", _alertRole.default], ["alertdialog", _alertdialogRole.default], ["application", _applicationRole.default], ["article", _articleRole.default], ["banner", _bannerRole.default], ["blockquote", _blockquoteRole.default], ["button", _buttonRole.default], ["caption", _captionRole.default], ["cell", _cellRole.default], ["checkbox", _checkboxRole.default], ["code", _codeRole.default], ["columnheader", _columnheaderRole.default], ["combobox", _comboboxRole.default], ["complementary", _complementaryRole.default], ["contentinfo", _contentinfoRole.default], ["definition", _definitionRole.default], ["deletion", _deletionRole.default], ["dialog", _dialogRole.default], ["directory", _directoryRole.default], ["document", _documentRole.default], ["emphasis", _emphasisRole.default], ["feed", _feedRole.default], ["figure", _figureRole.default], ["form", _formRole.default], ["generic", _genericRole.default], ["grid", _gridRole.default], ["gridcell", _gridcellRole.default], ["group", _groupRole.default], ["heading", _headingRole.default], ["img", _imgRole.default], ["insertion", _insertionRole.default], ["link", _linkRole.default], ["list", _listRole.default], ["listbox", _listboxRole.default], ["listitem", _listitemRole.default], ["log", _logRole.default], ["main", _mainRole.default], ["mark", _markRole.default], ["marquee", _marqueeRole.default], ["math", _mathRole.default], ["menu", _menuRole.default], ["menubar", _menubarRole.default], ["menuitem", _menuitemRole.default], ["menuitemcheckbox", _menuitemcheckboxRole.default], ["menuitemradio", _menuitemradioRole.default], ["meter", _meterRole.default], ["navigation", _navigationRole.default], ["none", _noneRole.default], ["note", _noteRole.default], ["option", _optionRole.default], ["paragraph", _paragraphRole.default], ["presentation", _presentationRole.default], ["progressbar", _progressbarRole.default], ["radio", _radioRole.default], ["radiogroup", _radiogroupRole.default], ["region", _regionRole.default], ["row", _rowRole.default], ["rowgroup", _rowgroupRole.default], ["rowheader", _rowheaderRole.default], ["scrollbar", _scrollbarRole.default], ["search", _searchRole.default], ["searchbox", _searchboxRole.default], ["separator", _separatorRole.default], ["slider", _sliderRole.default], ["spinbutton", _spinbuttonRole.default], ["status", _statusRole.default], ["strong", _strongRole.default], ["subscript", _subscriptRole.default], ["superscript", _superscriptRole.default], ["switch", _switchRole.default], ["tab", _tabRole.default], ["table", _tableRole.default], ["tablist", _tablistRole.default], ["tabpanel", _tabpanelRole.default], ["term", _termRole.default], ["textbox", _textboxRole.default], ["time", _timeRole.default], ["timer", _timerRole.default], ["toolbar", _toolbarRole.default], ["tooltip", _tooltipRole.default], ["tree", _treeRole.default], ["treegrid", _treegridRole.default], ["treeitem", _treeitemRole.default]];
ariaLiteralRoles$1.default = ariaLiteralRoles;
var ariaDpubRoles$1 = {};
var docAbstractRole$1 = {};
Object.defineProperty(docAbstractRole$1, "__esModule", {
  value: true
});
docAbstractRole$1.default = void 0;
var docAbstractRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "abstract [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
docAbstractRole$1.default = docAbstractRole;
var docAcknowledgmentsRole$1 = {};
Object.defineProperty(docAcknowledgmentsRole$1, "__esModule", {
  value: true
});
docAcknowledgmentsRole$1.default = void 0;
var docAcknowledgmentsRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "acknowledgments [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "landmark"]]
};
docAcknowledgmentsRole$1.default = docAcknowledgmentsRole;
var docAfterwordRole$1 = {};
Object.defineProperty(docAfterwordRole$1, "__esModule", {
  value: true
});
docAfterwordRole$1.default = void 0;
var docAfterwordRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "afterword [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "landmark"]]
};
docAfterwordRole$1.default = docAfterwordRole;
var docAppendixRole$1 = {};
Object.defineProperty(docAppendixRole$1, "__esModule", {
  value: true
});
docAppendixRole$1.default = void 0;
var docAppendixRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "appendix [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "landmark"]]
};
docAppendixRole$1.default = docAppendixRole;
var docBacklinkRole$1 = {};
Object.defineProperty(docBacklinkRole$1, "__esModule", {
  value: true
});
docBacklinkRole$1.default = void 0;
var docBacklinkRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author", "contents"],
  prohibitedProps: [],
  props: {
    "aria-errormessage": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "referrer [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "widget", "command", "link"]]
};
docBacklinkRole$1.default = docBacklinkRole;
var docBiblioentryRole$1 = {};
Object.defineProperty(docBiblioentryRole$1, "__esModule", {
  value: true
});
docBiblioentryRole$1.default = void 0;
var docBiblioentryRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "EPUB biblioentry [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: ["doc-bibliography"],
  requiredContextRole: ["doc-bibliography"],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "listitem"]]
};
docBiblioentryRole$1.default = docBiblioentryRole;
var docBibliographyRole$1 = {};
Object.defineProperty(docBibliographyRole$1, "__esModule", {
  value: true
});
docBibliographyRole$1.default = void 0;
var docBibliographyRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "bibliography [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [["doc-biblioentry"]],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "landmark"]]
};
docBibliographyRole$1.default = docBibliographyRole;
var docBibliorefRole$1 = {};
Object.defineProperty(docBibliorefRole$1, "__esModule", {
  value: true
});
docBibliorefRole$1.default = void 0;
var docBibliorefRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author", "contents"],
  prohibitedProps: [],
  props: {
    "aria-errormessage": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "biblioref [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "widget", "command", "link"]]
};
docBibliorefRole$1.default = docBibliorefRole;
var docChapterRole$1 = {};
Object.defineProperty(docChapterRole$1, "__esModule", {
  value: true
});
docChapterRole$1.default = void 0;
var docChapterRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "chapter [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "landmark"]]
};
docChapterRole$1.default = docChapterRole;
var docColophonRole$1 = {};
Object.defineProperty(docColophonRole$1, "__esModule", {
  value: true
});
docColophonRole$1.default = void 0;
var docColophonRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "colophon [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
docColophonRole$1.default = docColophonRole;
var docConclusionRole$1 = {};
Object.defineProperty(docConclusionRole$1, "__esModule", {
  value: true
});
docConclusionRole$1.default = void 0;
var docConclusionRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "conclusion [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "landmark"]]
};
docConclusionRole$1.default = docConclusionRole;
var docCoverRole$1 = {};
Object.defineProperty(docCoverRole$1, "__esModule", {
  value: true
});
docCoverRole$1.default = void 0;
var docCoverRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "cover [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "img"]]
};
docCoverRole$1.default = docCoverRole;
var docCreditRole$1 = {};
Object.defineProperty(docCreditRole$1, "__esModule", {
  value: true
});
docCreditRole$1.default = void 0;
var docCreditRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "credit [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
docCreditRole$1.default = docCreditRole;
var docCreditsRole$1 = {};
Object.defineProperty(docCreditsRole$1, "__esModule", {
  value: true
});
docCreditsRole$1.default = void 0;
var docCreditsRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "credits [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "landmark"]]
};
docCreditsRole$1.default = docCreditsRole;
var docDedicationRole$1 = {};
Object.defineProperty(docDedicationRole$1, "__esModule", {
  value: true
});
docDedicationRole$1.default = void 0;
var docDedicationRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "dedication [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
docDedicationRole$1.default = docDedicationRole;
var docEndnoteRole$1 = {};
Object.defineProperty(docEndnoteRole$1, "__esModule", {
  value: true
});
docEndnoteRole$1.default = void 0;
var docEndnoteRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "rearnote [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: ["doc-endnotes"],
  requiredContextRole: ["doc-endnotes"],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "listitem"]]
};
docEndnoteRole$1.default = docEndnoteRole;
var docEndnotesRole$1 = {};
Object.defineProperty(docEndnotesRole$1, "__esModule", {
  value: true
});
docEndnotesRole$1.default = void 0;
var docEndnotesRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "rearnotes [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [["doc-endnote"]],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "landmark"]]
};
docEndnotesRole$1.default = docEndnotesRole;
var docEpigraphRole$1 = {};
Object.defineProperty(docEpigraphRole$1, "__esModule", {
  value: true
});
docEpigraphRole$1.default = void 0;
var docEpigraphRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "epigraph [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
docEpigraphRole$1.default = docEpigraphRole;
var docEpilogueRole$1 = {};
Object.defineProperty(docEpilogueRole$1, "__esModule", {
  value: true
});
docEpilogueRole$1.default = void 0;
var docEpilogueRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "epilogue [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "landmark"]]
};
docEpilogueRole$1.default = docEpilogueRole;
var docErrataRole$1 = {};
Object.defineProperty(docErrataRole$1, "__esModule", {
  value: true
});
docErrataRole$1.default = void 0;
var docErrataRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "errata [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "landmark"]]
};
docErrataRole$1.default = docErrataRole;
var docExampleRole$1 = {};
Object.defineProperty(docExampleRole$1, "__esModule", {
  value: true
});
docExampleRole$1.default = void 0;
var docExampleRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
docExampleRole$1.default = docExampleRole;
var docFootnoteRole$1 = {};
Object.defineProperty(docFootnoteRole$1, "__esModule", {
  value: true
});
docFootnoteRole$1.default = void 0;
var docFootnoteRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "footnote [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
docFootnoteRole$1.default = docFootnoteRole;
var docForewordRole$1 = {};
Object.defineProperty(docForewordRole$1, "__esModule", {
  value: true
});
docForewordRole$1.default = void 0;
var docForewordRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "foreword [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "landmark"]]
};
docForewordRole$1.default = docForewordRole;
var docGlossaryRole$1 = {};
Object.defineProperty(docGlossaryRole$1, "__esModule", {
  value: true
});
docGlossaryRole$1.default = void 0;
var docGlossaryRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "glossary [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [["definition"], ["term"]],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "landmark"]]
};
docGlossaryRole$1.default = docGlossaryRole;
var docGlossrefRole$1 = {};
Object.defineProperty(docGlossrefRole$1, "__esModule", {
  value: true
});
docGlossrefRole$1.default = void 0;
var docGlossrefRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author", "contents"],
  prohibitedProps: [],
  props: {
    "aria-errormessage": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "glossref [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "widget", "command", "link"]]
};
docGlossrefRole$1.default = docGlossrefRole;
var docIndexRole$1 = {};
Object.defineProperty(docIndexRole$1, "__esModule", {
  value: true
});
docIndexRole$1.default = void 0;
var docIndexRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "index [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "landmark", "navigation"]]
};
docIndexRole$1.default = docIndexRole;
var docIntroductionRole$1 = {};
Object.defineProperty(docIntroductionRole$1, "__esModule", {
  value: true
});
docIntroductionRole$1.default = void 0;
var docIntroductionRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "introduction [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "landmark"]]
};
docIntroductionRole$1.default = docIntroductionRole;
var docNoterefRole$1 = {};
Object.defineProperty(docNoterefRole$1, "__esModule", {
  value: true
});
docNoterefRole$1.default = void 0;
var docNoterefRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author", "contents"],
  prohibitedProps: [],
  props: {
    "aria-errormessage": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "noteref [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "widget", "command", "link"]]
};
docNoterefRole$1.default = docNoterefRole;
var docNoticeRole$1 = {};
Object.defineProperty(docNoticeRole$1, "__esModule", {
  value: true
});
docNoticeRole$1.default = void 0;
var docNoticeRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "notice [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "note"]]
};
docNoticeRole$1.default = docNoticeRole;
var docPagebreakRole$1 = {};
Object.defineProperty(docPagebreakRole$1, "__esModule", {
  value: true
});
docPagebreakRole$1.default = void 0;
var docPagebreakRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: true,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "pagebreak [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "separator"]]
};
docPagebreakRole$1.default = docPagebreakRole;
var docPagefooterRole$1 = {};
Object.defineProperty(docPagefooterRole$1, "__esModule", {
  value: true
});
docPagefooterRole$1.default = void 0;
var docPagefooterRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["prohibited"],
  prohibitedProps: [],
  props: {
    "aria-braillelabel": null,
    "aria-brailleroledescription": null,
    "aria-description": null,
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
docPagefooterRole$1.default = docPagefooterRole;
var docPageheaderRole$1 = {};
Object.defineProperty(docPageheaderRole$1, "__esModule", {
  value: true
});
docPageheaderRole$1.default = void 0;
var docPageheaderRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["prohibited"],
  prohibitedProps: [],
  props: {
    "aria-braillelabel": null,
    "aria-brailleroledescription": null,
    "aria-description": null,
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
docPageheaderRole$1.default = docPageheaderRole;
var docPagelistRole$1 = {};
Object.defineProperty(docPagelistRole$1, "__esModule", {
  value: true
});
docPagelistRole$1.default = void 0;
var docPagelistRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "page-list [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "landmark", "navigation"]]
};
docPagelistRole$1.default = docPagelistRole;
var docPartRole$1 = {};
Object.defineProperty(docPartRole$1, "__esModule", {
  value: true
});
docPartRole$1.default = void 0;
var docPartRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "part [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "landmark"]]
};
docPartRole$1.default = docPartRole;
var docPrefaceRole$1 = {};
Object.defineProperty(docPrefaceRole$1, "__esModule", {
  value: true
});
docPrefaceRole$1.default = void 0;
var docPrefaceRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "preface [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "landmark"]]
};
docPrefaceRole$1.default = docPrefaceRole;
var docPrologueRole$1 = {};
Object.defineProperty(docPrologueRole$1, "__esModule", {
  value: true
});
docPrologueRole$1.default = void 0;
var docPrologueRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "prologue [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "landmark"]]
};
docPrologueRole$1.default = docPrologueRole;
var docPullquoteRole$1 = {};
Object.defineProperty(docPullquoteRole$1, "__esModule", {
  value: true
});
docPullquoteRole$1.default = void 0;
var docPullquoteRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {},
  relatedConcepts: [{
    concept: {
      name: "pullquote [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["none"]]
};
docPullquoteRole$1.default = docPullquoteRole;
var docQnaRole$1 = {};
Object.defineProperty(docQnaRole$1, "__esModule", {
  value: true
});
docQnaRole$1.default = void 0;
var docQnaRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "qna [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section"]]
};
docQnaRole$1.default = docQnaRole;
var docSubtitleRole$1 = {};
Object.defineProperty(docSubtitleRole$1, "__esModule", {
  value: true
});
docSubtitleRole$1.default = void 0;
var docSubtitleRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "subtitle [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "sectionhead"]]
};
docSubtitleRole$1.default = docSubtitleRole;
var docTipRole$1 = {};
Object.defineProperty(docTipRole$1, "__esModule", {
  value: true
});
docTipRole$1.default = void 0;
var docTipRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "help [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "note"]]
};
docTipRole$1.default = docTipRole;
var docTocRole$1 = {};
Object.defineProperty(docTocRole$1, "__esModule", {
  value: true
});
docTocRole$1.default = void 0;
var docTocRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    concept: {
      name: "toc [EPUB-SSV]"
    },
    module: "EPUB"
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "landmark", "navigation"]]
};
docTocRole$1.default = docTocRole;
Object.defineProperty(ariaDpubRoles$1, "__esModule", {
  value: true
});
ariaDpubRoles$1.default = void 0;
var _docAbstractRole = _interopRequireDefault$b(docAbstractRole$1);
var _docAcknowledgmentsRole = _interopRequireDefault$b(docAcknowledgmentsRole$1);
var _docAfterwordRole = _interopRequireDefault$b(docAfterwordRole$1);
var _docAppendixRole = _interopRequireDefault$b(docAppendixRole$1);
var _docBacklinkRole = _interopRequireDefault$b(docBacklinkRole$1);
var _docBiblioentryRole = _interopRequireDefault$b(docBiblioentryRole$1);
var _docBibliographyRole = _interopRequireDefault$b(docBibliographyRole$1);
var _docBibliorefRole = _interopRequireDefault$b(docBibliorefRole$1);
var _docChapterRole = _interopRequireDefault$b(docChapterRole$1);
var _docColophonRole = _interopRequireDefault$b(docColophonRole$1);
var _docConclusionRole = _interopRequireDefault$b(docConclusionRole$1);
var _docCoverRole = _interopRequireDefault$b(docCoverRole$1);
var _docCreditRole = _interopRequireDefault$b(docCreditRole$1);
var _docCreditsRole = _interopRequireDefault$b(docCreditsRole$1);
var _docDedicationRole = _interopRequireDefault$b(docDedicationRole$1);
var _docEndnoteRole = _interopRequireDefault$b(docEndnoteRole$1);
var _docEndnotesRole = _interopRequireDefault$b(docEndnotesRole$1);
var _docEpigraphRole = _interopRequireDefault$b(docEpigraphRole$1);
var _docEpilogueRole = _interopRequireDefault$b(docEpilogueRole$1);
var _docErrataRole = _interopRequireDefault$b(docErrataRole$1);
var _docExampleRole = _interopRequireDefault$b(docExampleRole$1);
var _docFootnoteRole = _interopRequireDefault$b(docFootnoteRole$1);
var _docForewordRole = _interopRequireDefault$b(docForewordRole$1);
var _docGlossaryRole = _interopRequireDefault$b(docGlossaryRole$1);
var _docGlossrefRole = _interopRequireDefault$b(docGlossrefRole$1);
var _docIndexRole = _interopRequireDefault$b(docIndexRole$1);
var _docIntroductionRole = _interopRequireDefault$b(docIntroductionRole$1);
var _docNoterefRole = _interopRequireDefault$b(docNoterefRole$1);
var _docNoticeRole = _interopRequireDefault$b(docNoticeRole$1);
var _docPagebreakRole = _interopRequireDefault$b(docPagebreakRole$1);
var _docPagefooterRole = _interopRequireDefault$b(docPagefooterRole$1);
var _docPageheaderRole = _interopRequireDefault$b(docPageheaderRole$1);
var _docPagelistRole = _interopRequireDefault$b(docPagelistRole$1);
var _docPartRole = _interopRequireDefault$b(docPartRole$1);
var _docPrefaceRole = _interopRequireDefault$b(docPrefaceRole$1);
var _docPrologueRole = _interopRequireDefault$b(docPrologueRole$1);
var _docPullquoteRole = _interopRequireDefault$b(docPullquoteRole$1);
var _docQnaRole = _interopRequireDefault$b(docQnaRole$1);
var _docSubtitleRole = _interopRequireDefault$b(docSubtitleRole$1);
var _docTipRole = _interopRequireDefault$b(docTipRole$1);
var _docTocRole = _interopRequireDefault$b(docTocRole$1);
function _interopRequireDefault$b(e2) {
  return e2 && e2.__esModule ? e2 : { default: e2 };
}
var ariaDpubRoles = [["doc-abstract", _docAbstractRole.default], ["doc-acknowledgments", _docAcknowledgmentsRole.default], ["doc-afterword", _docAfterwordRole.default], ["doc-appendix", _docAppendixRole.default], ["doc-backlink", _docBacklinkRole.default], ["doc-biblioentry", _docBiblioentryRole.default], ["doc-bibliography", _docBibliographyRole.default], ["doc-biblioref", _docBibliorefRole.default], ["doc-chapter", _docChapterRole.default], ["doc-colophon", _docColophonRole.default], ["doc-conclusion", _docConclusionRole.default], ["doc-cover", _docCoverRole.default], ["doc-credit", _docCreditRole.default], ["doc-credits", _docCreditsRole.default], ["doc-dedication", _docDedicationRole.default], ["doc-endnote", _docEndnoteRole.default], ["doc-endnotes", _docEndnotesRole.default], ["doc-epigraph", _docEpigraphRole.default], ["doc-epilogue", _docEpilogueRole.default], ["doc-errata", _docErrataRole.default], ["doc-example", _docExampleRole.default], ["doc-footnote", _docFootnoteRole.default], ["doc-foreword", _docForewordRole.default], ["doc-glossary", _docGlossaryRole.default], ["doc-glossref", _docGlossrefRole.default], ["doc-index", _docIndexRole.default], ["doc-introduction", _docIntroductionRole.default], ["doc-noteref", _docNoterefRole.default], ["doc-notice", _docNoticeRole.default], ["doc-pagebreak", _docPagebreakRole.default], ["doc-pagefooter", _docPagefooterRole.default], ["doc-pageheader", _docPageheaderRole.default], ["doc-pagelist", _docPagelistRole.default], ["doc-part", _docPartRole.default], ["doc-preface", _docPrefaceRole.default], ["doc-prologue", _docPrologueRole.default], ["doc-pullquote", _docPullquoteRole.default], ["doc-qna", _docQnaRole.default], ["doc-subtitle", _docSubtitleRole.default], ["doc-tip", _docTipRole.default], ["doc-toc", _docTocRole.default]];
ariaDpubRoles$1.default = ariaDpubRoles;
var ariaGraphicsRoles$1 = {};
var graphicsDocumentRole$1 = {};
Object.defineProperty(graphicsDocumentRole$1, "__esModule", {
  value: true
});
graphicsDocumentRole$1.default = void 0;
var graphicsDocumentRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    module: "GRAPHICS",
    concept: {
      name: "graphics-object"
    }
  }, {
    module: "ARIA",
    concept: {
      name: "img"
    }
  }, {
    module: "ARIA",
    concept: {
      name: "article"
    }
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "document"]]
};
graphicsDocumentRole$1.default = graphicsDocumentRole;
var graphicsObjectRole$1 = {};
Object.defineProperty(graphicsObjectRole$1, "__esModule", {
  value: true
});
graphicsObjectRole$1.default = void 0;
var graphicsObjectRole = {
  abstract: false,
  accessibleNameRequired: false,
  baseConcepts: [],
  childrenPresentational: false,
  nameFrom: ["author", "contents"],
  prohibitedProps: [],
  props: {
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [{
    module: "GRAPHICS",
    concept: {
      name: "graphics-document"
    }
  }, {
    module: "ARIA",
    concept: {
      name: "group"
    }
  }, {
    module: "ARIA",
    concept: {
      name: "img"
    }
  }, {
    module: "GRAPHICS",
    concept: {
      name: "graphics-symbol"
    }
  }],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "group"]]
};
graphicsObjectRole$1.default = graphicsObjectRole;
var graphicsSymbolRole$1 = {};
Object.defineProperty(graphicsSymbolRole$1, "__esModule", {
  value: true
});
graphicsSymbolRole$1.default = void 0;
var graphicsSymbolRole = {
  abstract: false,
  accessibleNameRequired: true,
  baseConcepts: [],
  childrenPresentational: true,
  nameFrom: ["author"],
  prohibitedProps: [],
  props: {
    "aria-disabled": null,
    "aria-errormessage": null,
    "aria-expanded": null,
    "aria-haspopup": null,
    "aria-invalid": null
  },
  relatedConcepts: [],
  requireContextRole: [],
  requiredContextRole: [],
  requiredOwnedElements: [],
  requiredProps: {},
  superClass: [["roletype", "structure", "section", "img"]]
};
graphicsSymbolRole$1.default = graphicsSymbolRole;
Object.defineProperty(ariaGraphicsRoles$1, "__esModule", {
  value: true
});
ariaGraphicsRoles$1.default = void 0;
var _graphicsDocumentRole = _interopRequireDefault$a(graphicsDocumentRole$1);
var _graphicsObjectRole = _interopRequireDefault$a(graphicsObjectRole$1);
var _graphicsSymbolRole = _interopRequireDefault$a(graphicsSymbolRole$1);
function _interopRequireDefault$a(e2) {
  return e2 && e2.__esModule ? e2 : { default: e2 };
}
var ariaGraphicsRoles = [["graphics-document", _graphicsDocumentRole.default], ["graphics-object", _graphicsObjectRole.default], ["graphics-symbol", _graphicsSymbolRole.default]];
ariaGraphicsRoles$1.default = ariaGraphicsRoles;
Object.defineProperty(rolesMap$1, "__esModule", {
  value: true
});
rolesMap$1.default = void 0;
var _ariaAbstractRoles = _interopRequireDefault$9(ariaAbstractRoles$1);
var _ariaLiteralRoles = _interopRequireDefault$9(ariaLiteralRoles$1);
var _ariaDpubRoles = _interopRequireDefault$9(ariaDpubRoles$1);
var _ariaGraphicsRoles = _interopRequireDefault$9(ariaGraphicsRoles$1);
var _iterationDecorator$6 = _interopRequireDefault$9(iterationDecorator$3);
function _interopRequireDefault$9(e2) {
  return e2 && e2.__esModule ? e2 : { default: e2 };
}
function _createForOfIteratorHelper$3(r, e2) {
  var t2 = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (!t2) {
    if (Array.isArray(r) || (t2 = _unsupportedIterableToArray$6(r)) || e2) {
      t2 && (r = t2);
      var _n = 0, F = function F2() {
      };
      return { s: F, n: function n2() {
        return _n >= r.length ? { done: true } : { done: false, value: r[_n++] };
      }, e: function e3(r2) {
        throw r2;
      }, f: F };
    }
    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  var o2, a2 = true, u2 = false;
  return { s: function s() {
    t2 = t2.call(r);
  }, n: function n2() {
    var r2 = t2.next();
    return a2 = r2.done, r2;
  }, e: function e3(r2) {
    u2 = true, o2 = r2;
  }, f: function f2() {
    try {
      a2 || null == t2.return || t2.return();
    } finally {
      if (u2) throw o2;
    }
  } };
}
function _slicedToArray$6(r, e2) {
  return _arrayWithHoles$6(r) || _iterableToArrayLimit$6(r, e2) || _unsupportedIterableToArray$6(r, e2) || _nonIterableRest$6();
}
function _nonIterableRest$6() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _unsupportedIterableToArray$6(r, a2) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray$6(r, a2);
    var t2 = {}.toString.call(r).slice(8, -1);
    return "Object" === t2 && r.constructor && (t2 = r.constructor.name), "Map" === t2 || "Set" === t2 ? Array.from(r) : "Arguments" === t2 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t2) ? _arrayLikeToArray$6(r, a2) : void 0;
  }
}
function _arrayLikeToArray$6(r, a2) {
  (null == a2 || a2 > r.length) && (a2 = r.length);
  for (var e2 = 0, n2 = Array(a2); e2 < a2; e2++) n2[e2] = r[e2];
  return n2;
}
function _iterableToArrayLimit$6(r, l2) {
  var t2 = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (null != t2) {
    var e2, n2, i, u2, a2 = [], f2 = true, o2 = false;
    try {
      if (i = (t2 = t2.call(r)).next, 0 === l2) {
        if (Object(t2) !== t2) return;
        f2 = false;
      } else for (; !(f2 = (e2 = i.call(t2)).done) && (a2.push(e2.value), a2.length !== l2); f2 = true) ;
    } catch (r2) {
      o2 = true, n2 = r2;
    } finally {
      try {
        if (!f2 && null != t2.return && (u2 = t2.return(), Object(u2) !== u2)) return;
      } finally {
        if (o2) throw n2;
      }
    }
    return a2;
  }
}
function _arrayWithHoles$6(r) {
  if (Array.isArray(r)) return r;
}
var roles = [].concat(_ariaAbstractRoles.default, _ariaLiteralRoles.default, _ariaDpubRoles.default, _ariaGraphicsRoles.default);
roles.forEach(function(_ref) {
  var _ref2 = _slicedToArray$6(_ref, 2), roleDefinition = _ref2[1];
  var _iterator2 = _createForOfIteratorHelper$3(roleDefinition.superClass), _step3;
  try {
    for (_iterator2.s(); !(_step3 = _iterator2.n()).done; ) {
      var superClassIter = _step3.value;
      var _iterator22 = _createForOfIteratorHelper$3(superClassIter), _step22;
      try {
        var _loop = function _loop2() {
          var superClassName = _step22.value;
          var superClassRoleTuple = roles.filter(function(_ref3) {
            var _ref4 = _slicedToArray$6(_ref3, 1), name = _ref4[0];
            return name === superClassName;
          })[0];
          if (superClassRoleTuple) {
            var superClassDefinition = superClassRoleTuple[1];
            for (var _i = 0, _Object$keys = Object.keys(superClassDefinition.props); _i < _Object$keys.length; _i++) {
              var prop2 = _Object$keys[_i];
              if (
                // $FlowIssue Accessing the hasOwnProperty on the Object prototype is fine.
                !Object.prototype.hasOwnProperty.call(roleDefinition.props, prop2)
              ) {
                roleDefinition.props[prop2] = superClassDefinition.props[prop2];
              }
            }
          }
        };
        for (_iterator22.s(); !(_step22 = _iterator22.n()).done; ) {
          _loop();
        }
      } catch (err) {
        _iterator22.e(err);
      } finally {
        _iterator22.f();
      }
    }
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }
});
var rolesMap = {
  entries: function entries3() {
    return roles;
  },
  forEach: function forEach3(fn) {
    var thisArg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
    var _iterator3 = _createForOfIteratorHelper$3(roles), _step3;
    try {
      for (_iterator3.s(); !(_step3 = _iterator3.n()).done; ) {
        var _step3$value = _slicedToArray$6(_step3.value, 2), key = _step3$value[0], values10 = _step3$value[1];
        fn.call(thisArg, values10, key, roles);
      }
    } catch (err) {
      _iterator3.e(err);
    } finally {
      _iterator3.f();
    }
  },
  get: function get3(key) {
    var item = roles.filter(function(tuple) {
      return tuple[0] === key ? true : false;
    })[0];
    return item && item[1];
  },
  has: function has3(key) {
    return !!rolesMap.get(key);
  },
  keys: function keys3() {
    return roles.map(function(_ref5) {
      var _ref6 = _slicedToArray$6(_ref5, 1), key = _ref6[0];
      return key;
    });
  },
  values: function values3() {
    return roles.map(function(_ref7) {
      var _ref8 = _slicedToArray$6(_ref7, 2), values10 = _ref8[1];
      return values10;
    });
  }
};
rolesMap$1.default = (0, _iterationDecorator$6.default)(rolesMap, rolesMap.entries());
var elementRoleMap$1 = {};
Object.defineProperty(elementRoleMap$1, "__esModule", {
  value: true
});
elementRoleMap$1.default = void 0;
var _iterationDecorator$5 = _interopRequireDefault$8(iterationDecorator$3);
var _rolesMap$2 = _interopRequireDefault$8(rolesMap$1);
function _interopRequireDefault$8(e2) {
  return e2 && e2.__esModule ? e2 : { default: e2 };
}
function _slicedToArray$5(r, e2) {
  return _arrayWithHoles$5(r) || _iterableToArrayLimit$5(r, e2) || _unsupportedIterableToArray$5(r, e2) || _nonIterableRest$5();
}
function _nonIterableRest$5() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _unsupportedIterableToArray$5(r, a2) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray$5(r, a2);
    var t2 = {}.toString.call(r).slice(8, -1);
    return "Object" === t2 && r.constructor && (t2 = r.constructor.name), "Map" === t2 || "Set" === t2 ? Array.from(r) : "Arguments" === t2 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t2) ? _arrayLikeToArray$5(r, a2) : void 0;
  }
}
function _arrayLikeToArray$5(r, a2) {
  (null == a2 || a2 > r.length) && (a2 = r.length);
  for (var e2 = 0, n2 = Array(a2); e2 < a2; e2++) n2[e2] = r[e2];
  return n2;
}
function _iterableToArrayLimit$5(r, l2) {
  var t2 = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (null != t2) {
    var e2, n2, i, u2, a2 = [], f2 = true, o2 = false;
    try {
      if (i = (t2 = t2.call(r)).next, 0 === l2) {
        if (Object(t2) !== t2) return;
        f2 = false;
      } else for (; !(f2 = (e2 = i.call(t2)).done) && (a2.push(e2.value), a2.length !== l2); f2 = true) ;
    } catch (r2) {
      o2 = true, n2 = r2;
    } finally {
      try {
        if (!f2 && null != t2.return && (u2 = t2.return(), Object(u2) !== u2)) return;
      } finally {
        if (o2) throw n2;
      }
    }
    return a2;
  }
}
function _arrayWithHoles$5(r) {
  if (Array.isArray(r)) return r;
}
var elementRoles = [];
var keys$1 = _rolesMap$2.default.keys();
for (var i$1 = 0; i$1 < keys$1.length; i$1++) {
  var key$1 = keys$1[i$1];
  var role$1 = _rolesMap$2.default.get(key$1);
  if (role$1) {
    var concepts$1 = [].concat(role$1.baseConcepts, role$1.relatedConcepts);
    var _loop$3 = function _loop() {
      var relation = concepts$1[k$1];
      if (relation.module === "HTML") {
        var concept = relation.concept;
        if (concept) {
          var elementRoleRelation = elementRoles.filter(function(relation2) {
            return ariaRoleRelationConceptEquals(relation2[0], concept);
          })[0];
          var roles2;
          if (elementRoleRelation) {
            roles2 = elementRoleRelation[1];
          } else {
            roles2 = [];
          }
          var isUnique = true;
          for (var _i = 0; _i < roles2.length; _i++) {
            if (roles2[_i] === key$1) {
              isUnique = false;
              break;
            }
          }
          if (isUnique) {
            roles2.push(key$1);
          }
          if (!elementRoleRelation) {
            elementRoles.push([concept, roles2]);
          }
        }
      }
    };
    for (var k$1 = 0; k$1 < concepts$1.length; k$1++) {
      _loop$3();
    }
  }
}
var elementRoleMap = {
  entries: function entries4() {
    return elementRoles;
  },
  forEach: function forEach4(fn) {
    var thisArg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
    for (var _i2 = 0, _elementRoles = elementRoles; _i2 < _elementRoles.length; _i2++) {
      var _elementRoles$_i = _slicedToArray$5(_elementRoles[_i2], 2), _key = _elementRoles$_i[0], values10 = _elementRoles$_i[1];
      fn.call(thisArg, values10, _key, elementRoles);
    }
  },
  get: function get4(key) {
    var item = elementRoles.filter(function(tuple) {
      return key.name === tuple[0].name && ariaRoleRelationConceptAttributeEquals(key.attributes, tuple[0].attributes);
    })[0];
    return item && item[1];
  },
  has: function has4(key) {
    return !!elementRoleMap.get(key);
  },
  keys: function keys4() {
    return elementRoles.map(function(_ref) {
      var _ref2 = _slicedToArray$5(_ref, 1), key = _ref2[0];
      return key;
    });
  },
  values: function values4() {
    return elementRoles.map(function(_ref3) {
      var _ref4 = _slicedToArray$5(_ref3, 2), values10 = _ref4[1];
      return values10;
    });
  }
};
function ariaRoleRelationConceptEquals(a2, b2) {
  return a2.name === b2.name && ariaRoleRelationConstraintsEquals(a2.constraints, b2.constraints) && ariaRoleRelationConceptAttributeEquals(a2.attributes, b2.attributes);
}
function ariaRoleRelationConstraintsEquals(a2, b2) {
  if (a2 === void 0 && b2 !== void 0) {
    return false;
  }
  if (a2 !== void 0 && b2 === void 0) {
    return false;
  }
  if (a2 !== void 0 && b2 !== void 0) {
    if (a2.length !== b2.length) {
      return false;
    }
    for (var _i3 = 0; _i3 < a2.length; _i3++) {
      if (a2[_i3] !== b2[_i3]) {
        return false;
      }
    }
  }
  return true;
}
function ariaRoleRelationConceptAttributeEquals(a2, b2) {
  if (a2 === void 0 && b2 !== void 0) {
    return false;
  }
  if (a2 !== void 0 && b2 === void 0) {
    return false;
  }
  if (a2 !== void 0 && b2 !== void 0) {
    if (a2.length !== b2.length) {
      return false;
    }
    for (var _i4 = 0; _i4 < a2.length; _i4++) {
      if (a2[_i4].name !== b2[_i4].name || a2[_i4].value !== b2[_i4].value) {
        return false;
      }
      if (a2[_i4].constraints === void 0 && b2[_i4].constraints !== void 0) {
        return false;
      }
      if (a2[_i4].constraints !== void 0 && b2[_i4].constraints === void 0) {
        return false;
      }
      if (a2[_i4].constraints !== void 0 && b2[_i4].constraints !== void 0) {
        if (a2[_i4].constraints.length !== b2[_i4].constraints.length) {
          return false;
        }
        for (var j = 0; j < a2[_i4].constraints.length; j++) {
          if (a2[_i4].constraints[j] !== b2[_i4].constraints[j]) {
            return false;
          }
        }
      }
    }
  }
  return true;
}
elementRoleMap$1.default = (0, _iterationDecorator$5.default)(elementRoleMap, elementRoleMap.entries());
var roleElementMap$1 = {};
Object.defineProperty(roleElementMap$1, "__esModule", {
  value: true
});
roleElementMap$1.default = void 0;
var _iterationDecorator$4 = _interopRequireDefault$7(iterationDecorator$3);
var _rolesMap$1 = _interopRequireDefault$7(rolesMap$1);
function _interopRequireDefault$7(e2) {
  return e2 && e2.__esModule ? e2 : { default: e2 };
}
function _slicedToArray$4(r, e2) {
  return _arrayWithHoles$4(r) || _iterableToArrayLimit$4(r, e2) || _unsupportedIterableToArray$4(r, e2) || _nonIterableRest$4();
}
function _nonIterableRest$4() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _unsupportedIterableToArray$4(r, a2) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray$4(r, a2);
    var t2 = {}.toString.call(r).slice(8, -1);
    return "Object" === t2 && r.constructor && (t2 = r.constructor.name), "Map" === t2 || "Set" === t2 ? Array.from(r) : "Arguments" === t2 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t2) ? _arrayLikeToArray$4(r, a2) : void 0;
  }
}
function _arrayLikeToArray$4(r, a2) {
  (null == a2 || a2 > r.length) && (a2 = r.length);
  for (var e2 = 0, n2 = Array(a2); e2 < a2; e2++) n2[e2] = r[e2];
  return n2;
}
function _iterableToArrayLimit$4(r, l2) {
  var t2 = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (null != t2) {
    var e2, n2, i, u2, a2 = [], f2 = true, o2 = false;
    try {
      if (i = (t2 = t2.call(r)).next, 0 === l2) {
        if (Object(t2) !== t2) return;
        f2 = false;
      } else for (; !(f2 = (e2 = i.call(t2)).done) && (a2.push(e2.value), a2.length !== l2); f2 = true) ;
    } catch (r2) {
      o2 = true, n2 = r2;
    } finally {
      try {
        if (!f2 && null != t2.return && (u2 = t2.return(), Object(u2) !== u2)) return;
      } finally {
        if (o2) throw n2;
      }
    }
    return a2;
  }
}
function _arrayWithHoles$4(r) {
  if (Array.isArray(r)) return r;
}
var roleElement = [];
var keys5 = _rolesMap$1.default.keys();
for (var i = 0; i < keys5.length; i++) {
  var key = keys5[i];
  var role = _rolesMap$1.default.get(key);
  var relationConcepts = [];
  if (role) {
    var concepts = [].concat(role.baseConcepts, role.relatedConcepts);
    for (var k = 0; k < concepts.length; k++) {
      var relation = concepts[k];
      if (relation.module === "HTML") {
        var concept = relation.concept;
        if (concept != null) {
          relationConcepts.push(concept);
        }
      }
    }
    if (relationConcepts.length > 0) {
      roleElement.push([key, relationConcepts]);
    }
  }
}
var roleElementMap = {
  entries: function entries5() {
    return roleElement;
  },
  forEach: function forEach5(fn) {
    var thisArg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
    for (var _i = 0, _roleElement = roleElement; _i < _roleElement.length; _i++) {
      var _roleElement$_i = _slicedToArray$4(_roleElement[_i], 2), _key = _roleElement$_i[0], values10 = _roleElement$_i[1];
      fn.call(thisArg, values10, _key, roleElement);
    }
  },
  get: function get5(key) {
    var item = roleElement.filter(function(tuple) {
      return tuple[0] === key ? true : false;
    })[0];
    return item && item[1];
  },
  has: function has5(key) {
    return !!roleElementMap.get(key);
  },
  keys: function keys6() {
    return roleElement.map(function(_ref) {
      var _ref2 = _slicedToArray$4(_ref, 1), key = _ref2[0];
      return key;
    });
  },
  values: function values5() {
    return roleElement.map(function(_ref3) {
      var _ref4 = _slicedToArray$4(_ref3, 2), values10 = _ref4[1];
      return values10;
    });
  }
};
roleElementMap$1.default = (0, _iterationDecorator$4.default)(roleElementMap, roleElementMap.entries());
var elementRoles_1;
Object.defineProperty(lib$1, "__esModule", {
  value: true
});
var roles_1 = lib$1.roles = lib$1.roleElements = elementRoles_1 = lib$1.elementRoles = lib$1.dom = lib$1.aria = void 0;
var _ariaPropsMap = _interopRequireDefault$6(ariaPropsMap$1);
var _domMap = _interopRequireDefault$6(domMap$1);
var _rolesMap = _interopRequireDefault$6(rolesMap$1);
var _elementRoleMap = _interopRequireDefault$6(elementRoleMap$1);
var _roleElementMap = _interopRequireDefault$6(roleElementMap$1);
function _interopRequireDefault$6(e2) {
  return e2 && e2.__esModule ? e2 : { default: e2 };
}
lib$1.aria = _ariaPropsMap.default;
lib$1.dom = _domMap.default;
roles_1 = lib$1.roles = _rolesMap.default;
elementRoles_1 = lib$1.elementRoles = _elementRoleMap.default;
lib$1.roleElements = _roleElementMap.default;
var lib = {};
var AXObjectElementMap$1 = {};
var iterationDecorator$1 = {};
var iteratorProxy$1 = {};
Object.defineProperty(iteratorProxy$1, "__esModule", {
  value: true
});
iteratorProxy$1.default = void 0;
function iteratorProxy() {
  var values10 = this;
  var index2 = 0;
  var iter = {
    "@@iterator": function iterator() {
      return iter;
    },
    next: function next() {
      if (index2 < values10.length) {
        var value = values10[index2];
        index2 = index2 + 1;
        return {
          done: false,
          value
        };
      } else {
        return {
          done: true
        };
      }
    }
  };
  return iter;
}
var _default$20 = iteratorProxy;
iteratorProxy$1.default = _default$20;
Object.defineProperty(iterationDecorator$1, "__esModule", {
  value: true
});
iterationDecorator$1.default = iterationDecorator;
var _iteratorProxy = _interopRequireDefault$5(iteratorProxy$1);
function _interopRequireDefault$5(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}
function _typeof(obj) {
  "@babel/helpers - typeof";
  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(obj2) {
    return typeof obj2;
  } : function(obj2) {
    return obj2 && "function" == typeof Symbol && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : typeof obj2;
  }, _typeof(obj);
}
function iterationDecorator(collection, entries10) {
  if (typeof Symbol === "function" && _typeof(Symbol.iterator) === "symbol") {
    Object.defineProperty(collection, Symbol.iterator, {
      value: _iteratorProxy.default.bind(entries10)
    });
  }
  return collection;
}
var AXObjectsMap$1 = {};
var AbbrRole$1 = {};
Object.defineProperty(AbbrRole$1, "__esModule", {
  value: true
});
AbbrRole$1.default = void 0;
var AbbrRole = {
  relatedConcepts: [{
    module: "HTML",
    concept: {
      name: "abbr"
    }
  }],
  type: "structure"
};
var _default$1$ = AbbrRole;
AbbrRole$1.default = _default$1$;
var AlertDialogRole$1 = {};
Object.defineProperty(AlertDialogRole$1, "__esModule", {
  value: true
});
AlertDialogRole$1.default = void 0;
var AlertDialogRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "alertdialog"
    }
  }],
  type: "window"
};
var _default$1_ = AlertDialogRole;
AlertDialogRole$1.default = _default$1_;
var AlertRole$1 = {};
Object.defineProperty(AlertRole$1, "__esModule", {
  value: true
});
AlertRole$1.default = void 0;
var AlertRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "alert"
    }
  }],
  type: "structure"
};
var _default$1Z = AlertRole;
AlertRole$1.default = _default$1Z;
var AnnotationRole$1 = {};
Object.defineProperty(AnnotationRole$1, "__esModule", {
  value: true
});
AnnotationRole$1.default = void 0;
var AnnotationRole = {
  relatedConcepts: [],
  type: "structure"
};
var _default$1Y = AnnotationRole;
AnnotationRole$1.default = _default$1Y;
var ApplicationRole$1 = {};
Object.defineProperty(ApplicationRole$1, "__esModule", {
  value: true
});
ApplicationRole$1.default = void 0;
var ApplicationRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "application"
    }
  }],
  type: "window"
};
var _default$1X = ApplicationRole;
ApplicationRole$1.default = _default$1X;
var ArticleRole$1 = {};
Object.defineProperty(ArticleRole$1, "__esModule", {
  value: true
});
ArticleRole$1.default = void 0;
var ArticleRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "article"
    }
  }, {
    module: "HTML",
    concept: {
      name: "article"
    }
  }],
  type: "structure"
};
var _default$1W = ArticleRole;
ArticleRole$1.default = _default$1W;
var AudioRole$1 = {};
Object.defineProperty(AudioRole$1, "__esModule", {
  value: true
});
AudioRole$1.default = void 0;
var AudioRole = {
  relatedConcepts: [{
    module: "HTML",
    concept: {
      name: "audio"
    }
  }],
  type: "widget"
};
var _default$1V = AudioRole;
AudioRole$1.default = _default$1V;
var BannerRole$1 = {};
Object.defineProperty(BannerRole$1, "__esModule", {
  value: true
});
BannerRole$1.default = void 0;
var BannerRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "banner"
    }
  }],
  type: "structure"
};
var _default$1U = BannerRole;
BannerRole$1.default = _default$1U;
var BlockquoteRole$1 = {};
Object.defineProperty(BlockquoteRole$1, "__esModule", {
  value: true
});
BlockquoteRole$1.default = void 0;
var BlockquoteRole = {
  relatedConcepts: [{
    module: "HTML",
    concept: {
      name: "blockquote"
    }
  }],
  type: "structure"
};
var _default$1T = BlockquoteRole;
BlockquoteRole$1.default = _default$1T;
var BusyIndicatorRole$1 = {};
Object.defineProperty(BusyIndicatorRole$1, "__esModule", {
  value: true
});
BusyIndicatorRole$1.default = void 0;
var BusyIndicatorRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      attributes: [{
        name: "aria-busy",
        value: "true"
      }]
    }
  }],
  type: "widget"
};
var _default$1S = BusyIndicatorRole;
BusyIndicatorRole$1.default = _default$1S;
var ButtonRole$1 = {};
Object.defineProperty(ButtonRole$1, "__esModule", {
  value: true
});
ButtonRole$1.default = void 0;
var ButtonRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "button"
    }
  }, {
    module: "HTML",
    concept: {
      name: "button"
    }
  }],
  type: "widget"
};
var _default$1R = ButtonRole;
ButtonRole$1.default = _default$1R;
var CanvasRole$1 = {};
Object.defineProperty(CanvasRole$1, "__esModule", {
  value: true
});
CanvasRole$1.default = void 0;
var CanvasRole = {
  relatedConcepts: [{
    module: "HTML",
    concept: {
      name: "canvas"
    }
  }],
  type: "widget"
};
var _default$1Q = CanvasRole;
CanvasRole$1.default = _default$1Q;
var CaptionRole$1 = {};
Object.defineProperty(CaptionRole$1, "__esModule", {
  value: true
});
CaptionRole$1.default = void 0;
var CaptionRole = {
  relatedConcepts: [{
    module: "HTML",
    concept: {
      name: "caption"
    }
  }],
  type: "structure"
};
var _default$1P = CaptionRole;
CaptionRole$1.default = _default$1P;
var CellRole$1 = {};
Object.defineProperty(CellRole$1, "__esModule", {
  value: true
});
CellRole$1.default = void 0;
var CellRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "cell"
    }
  }, {
    module: "ARIA",
    concept: {
      name: "gridcell"
    }
  }, {
    module: "HTML",
    concept: {
      name: "td"
    }
  }],
  type: "widget"
};
var _default$1O = CellRole;
CellRole$1.default = _default$1O;
var CheckBoxRole$1 = {};
Object.defineProperty(CheckBoxRole$1, "__esModule", {
  value: true
});
CheckBoxRole$1.default = void 0;
var CheckBoxRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "checkbox"
    }
  }, {
    module: "HTML",
    concept: {
      name: "input",
      attributes: [{
        name: "type",
        value: "checkbox"
      }]
    }
  }],
  type: "widget"
};
var _default$1N = CheckBoxRole;
CheckBoxRole$1.default = _default$1N;
var ColorWellRole$1 = {};
Object.defineProperty(ColorWellRole$1, "__esModule", {
  value: true
});
ColorWellRole$1.default = void 0;
var ColorWellRole = {
  relatedConcepts: [{
    module: "HTML",
    concept: {
      name: "input",
      attributes: [{
        name: "type",
        value: "color"
      }]
    }
  }],
  type: "widget"
};
var _default$1M = ColorWellRole;
ColorWellRole$1.default = _default$1M;
var ColumnHeaderRole$1 = {};
Object.defineProperty(ColumnHeaderRole$1, "__esModule", {
  value: true
});
ColumnHeaderRole$1.default = void 0;
var ColumnHeaderRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "columnheader"
    }
  }, {
    module: "HTML",
    concept: {
      name: "th"
    }
  }],
  type: "widget"
};
var _default$1L = ColumnHeaderRole;
ColumnHeaderRole$1.default = _default$1L;
var ColumnRole$1 = {};
Object.defineProperty(ColumnRole$1, "__esModule", {
  value: true
});
ColumnRole$1.default = void 0;
var ColumnRole = {
  relatedConcepts: [],
  type: "structure"
};
var _default$1K = ColumnRole;
ColumnRole$1.default = _default$1K;
var ComboBoxRole$1 = {};
Object.defineProperty(ComboBoxRole$1, "__esModule", {
  value: true
});
ComboBoxRole$1.default = void 0;
var ComboBoxRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "combobox"
    }
  }, {
    module: "HTML",
    concept: {
      name: "select"
    }
  }],
  type: "widget"
};
var _default$1J = ComboBoxRole;
ComboBoxRole$1.default = _default$1J;
var ComplementaryRole$1 = {};
Object.defineProperty(ComplementaryRole$1, "__esModule", {
  value: true
});
ComplementaryRole$1.default = void 0;
var ComplementaryRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "complementary"
    }
  }],
  type: "structure"
};
var _default$1I = ComplementaryRole;
ComplementaryRole$1.default = _default$1I;
var ContentInfoRole$1 = {};
Object.defineProperty(ContentInfoRole$1, "__esModule", {
  value: true
});
ContentInfoRole$1.default = void 0;
var ContentInfoRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "structureinfo"
    }
  }],
  type: "structure"
};
var _default$1H = ContentInfoRole;
ContentInfoRole$1.default = _default$1H;
var DateRole$1 = {};
Object.defineProperty(DateRole$1, "__esModule", {
  value: true
});
DateRole$1.default = void 0;
var DateRole = {
  relatedConcepts: [{
    module: "HTML",
    concept: {
      name: "input",
      attributes: [{
        name: "type",
        value: "date"
      }]
    }
  }],
  type: "widget"
};
var _default$1G = DateRole;
DateRole$1.default = _default$1G;
var DateTimeRole$1 = {};
Object.defineProperty(DateTimeRole$1, "__esModule", {
  value: true
});
DateTimeRole$1.default = void 0;
var DateTimeRole = {
  relatedConcepts: [{
    module: "HTML",
    concept: {
      name: "input",
      attributes: [{
        name: "type",
        value: "datetime"
      }]
    }
  }],
  type: "widget"
};
var _default$1F = DateTimeRole;
DateTimeRole$1.default = _default$1F;
var DefinitionRole$1 = {};
Object.defineProperty(DefinitionRole$1, "__esModule", {
  value: true
});
DefinitionRole$1.default = void 0;
var DefinitionRole = {
  relatedConcepts: [{
    module: "HTML",
    concept: {
      name: "dfn"
    }
  }],
  type: "structure"
};
var _default$1E = DefinitionRole;
DefinitionRole$1.default = _default$1E;
var DescriptionListDetailRole$1 = {};
Object.defineProperty(DescriptionListDetailRole$1, "__esModule", {
  value: true
});
DescriptionListDetailRole$1.default = void 0;
var DescriptionListDetailRole = {
  relatedConcepts: [{
    module: "HTML",
    concept: {
      name: "dd"
    }
  }],
  type: "structure"
};
var _default$1D = DescriptionListDetailRole;
DescriptionListDetailRole$1.default = _default$1D;
var DescriptionListRole$1 = {};
Object.defineProperty(DescriptionListRole$1, "__esModule", {
  value: true
});
DescriptionListRole$1.default = void 0;
var DescriptionListRole = {
  relatedConcepts: [{
    module: "HTML",
    concept: {
      name: "dl"
    }
  }],
  type: "structure"
};
var _default$1C = DescriptionListRole;
DescriptionListRole$1.default = _default$1C;
var DescriptionListTermRole$1 = {};
Object.defineProperty(DescriptionListTermRole$1, "__esModule", {
  value: true
});
DescriptionListTermRole$1.default = void 0;
var DescriptionListTermRole = {
  relatedConcepts: [{
    module: "HTML",
    concept: {
      name: "dt"
    }
  }],
  type: "structure"
};
var _default$1B = DescriptionListTermRole;
DescriptionListTermRole$1.default = _default$1B;
var DetailsRole$1 = {};
Object.defineProperty(DetailsRole$1, "__esModule", {
  value: true
});
DetailsRole$1.default = void 0;
var DetailsRole = {
  relatedConcepts: [{
    module: "HTML",
    concept: {
      name: "details"
    }
  }],
  type: "structure"
};
var _default$1A = DetailsRole;
DetailsRole$1.default = _default$1A;
var DialogRole$1 = {};
Object.defineProperty(DialogRole$1, "__esModule", {
  value: true
});
DialogRole$1.default = void 0;
var DialogRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "dialog"
    }
  }, {
    module: "HTML",
    concept: {
      name: "dialog"
    }
  }],
  type: "window"
};
var _default$1z = DialogRole;
DialogRole$1.default = _default$1z;
var DirectoryRole$1 = {};
Object.defineProperty(DirectoryRole$1, "__esModule", {
  value: true
});
DirectoryRole$1.default = void 0;
var DirectoryRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "directory"
    }
  }, {
    module: "HTML",
    concept: {
      name: "dir"
    }
  }],
  type: "structure"
};
var _default$1y = DirectoryRole;
DirectoryRole$1.default = _default$1y;
var DisclosureTriangleRole$1 = {};
Object.defineProperty(DisclosureTriangleRole$1, "__esModule", {
  value: true
});
DisclosureTriangleRole$1.default = void 0;
var DisclosureTriangleRole = {
  relatedConcepts: [{
    module: "HTML",
    concept: {
      constraints: ["scoped to a details element"],
      name: "summary"
    }
  }],
  type: "widget"
};
var _default$1x = DisclosureTriangleRole;
DisclosureTriangleRole$1.default = _default$1x;
var DivRole$1 = {};
Object.defineProperty(DivRole$1, "__esModule", {
  value: true
});
DivRole$1.default = void 0;
var DivRole = {
  relatedConcepts: [{
    module: "HTML",
    concept: {
      name: "div"
    }
  }],
  type: "generic"
};
var _default$1w = DivRole;
DivRole$1.default = _default$1w;
var DocumentRole$1 = {};
Object.defineProperty(DocumentRole$1, "__esModule", {
  value: true
});
DocumentRole$1.default = void 0;
var DocumentRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "document"
    }
  }],
  type: "structure"
};
var _default$1v = DocumentRole;
DocumentRole$1.default = _default$1v;
var EmbeddedObjectRole$1 = {};
Object.defineProperty(EmbeddedObjectRole$1, "__esModule", {
  value: true
});
EmbeddedObjectRole$1.default = void 0;
var EmbeddedObjectRole = {
  relatedConcepts: [{
    module: "HTML",
    concept: {
      name: "embed"
    }
  }],
  type: "widget"
};
var _default$1u = EmbeddedObjectRole;
EmbeddedObjectRole$1.default = _default$1u;
var FeedRole$1 = {};
Object.defineProperty(FeedRole$1, "__esModule", {
  value: true
});
FeedRole$1.default = void 0;
var FeedRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "feed"
    }
  }],
  type: "structure"
};
var _default$1t = FeedRole;
FeedRole$1.default = _default$1t;
var FigcaptionRole$1 = {};
Object.defineProperty(FigcaptionRole$1, "__esModule", {
  value: true
});
FigcaptionRole$1.default = void 0;
var FigcaptionRole = {
  relatedConcepts: [{
    module: "HTML",
    concept: {
      name: "figcaption"
    }
  }],
  type: "structure"
};
var _default$1s = FigcaptionRole;
FigcaptionRole$1.default = _default$1s;
var FigureRole$1 = {};
Object.defineProperty(FigureRole$1, "__esModule", {
  value: true
});
FigureRole$1.default = void 0;
var FigureRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "figure"
    }
  }, {
    module: "HTML",
    concept: {
      name: "figure"
    }
  }],
  type: "structure"
};
var _default$1r = FigureRole;
FigureRole$1.default = _default$1r;
var FooterRole$1 = {};
Object.defineProperty(FooterRole$1, "__esModule", {
  value: true
});
FooterRole$1.default = void 0;
var FooterRole = {
  relatedConcepts: [{
    module: "HTML",
    concept: {
      name: "footer"
    }
  }],
  type: "structure"
};
var _default$1q = FooterRole;
FooterRole$1.default = _default$1q;
var FormRole$1 = {};
Object.defineProperty(FormRole$1, "__esModule", {
  value: true
});
FormRole$1.default = void 0;
var FormRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "form"
    }
  }, {
    module: "HTML",
    concept: {
      name: "form"
    }
  }],
  type: "structure"
};
var _default$1p = FormRole;
FormRole$1.default = _default$1p;
var GridRole$1 = {};
Object.defineProperty(GridRole$1, "__esModule", {
  value: true
});
GridRole$1.default = void 0;
var GridRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "grid"
    }
  }],
  type: "widget"
};
var _default$1o = GridRole;
GridRole$1.default = _default$1o;
var GroupRole$1 = {};
Object.defineProperty(GroupRole$1, "__esModule", {
  value: true
});
GroupRole$1.default = void 0;
var GroupRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "group"
    }
  }],
  type: "structure"
};
var _default$1n = GroupRole;
GroupRole$1.default = _default$1n;
var HeadingRole$1 = {};
Object.defineProperty(HeadingRole$1, "__esModule", {
  value: true
});
HeadingRole$1.default = void 0;
var HeadingRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "heading"
    }
  }, {
    module: "HTML",
    concept: {
      name: "h1"
    }
  }, {
    module: "HTML",
    concept: {
      name: "h2"
    }
  }, {
    module: "HTML",
    concept: {
      name: "h3"
    }
  }, {
    module: "HTML",
    concept: {
      name: "h4"
    }
  }, {
    module: "HTML",
    concept: {
      name: "h5"
    }
  }, {
    module: "HTML",
    concept: {
      name: "h6"
    }
  }],
  type: "structure"
};
var _default$1m = HeadingRole;
HeadingRole$1.default = _default$1m;
var IframePresentationalRole$1 = {};
Object.defineProperty(IframePresentationalRole$1, "__esModule", {
  value: true
});
IframePresentationalRole$1.default = void 0;
var IframePresentationalRole = {
  relatedConcepts: [],
  type: "window"
};
var _default$1l = IframePresentationalRole;
IframePresentationalRole$1.default = _default$1l;
var IframeRole$1 = {};
Object.defineProperty(IframeRole$1, "__esModule", {
  value: true
});
IframeRole$1.default = void 0;
var IframeRole = {
  relatedConcepts: [{
    module: "HTML",
    concept: {
      name: "iframe"
    }
  }],
  type: "window"
};
var _default$1k = IframeRole;
IframeRole$1.default = _default$1k;
var IgnoredRole$1 = {};
Object.defineProperty(IgnoredRole$1, "__esModule", {
  value: true
});
IgnoredRole$1.default = void 0;
var IgnoredRole = {
  relatedConcepts: [],
  type: "structure"
};
var _default$1j = IgnoredRole;
IgnoredRole$1.default = _default$1j;
var ImageMapLinkRole$1 = {};
Object.defineProperty(ImageMapLinkRole$1, "__esModule", {
  value: true
});
ImageMapLinkRole$1.default = void 0;
var ImageMapLinkRole = {
  relatedConcepts: [],
  type: "widget"
};
var _default$1i = ImageMapLinkRole;
ImageMapLinkRole$1.default = _default$1i;
var ImageMapRole$1 = {};
Object.defineProperty(ImageMapRole$1, "__esModule", {
  value: true
});
ImageMapRole$1.default = void 0;
var ImageMapRole = {
  relatedConcepts: [{
    module: "HTML",
    concept: {
      name: "img",
      attributes: [{
        name: "usemap"
      }]
    }
  }],
  type: "structure"
};
var _default$1h = ImageMapRole;
ImageMapRole$1.default = _default$1h;
var ImageRole$1 = {};
Object.defineProperty(ImageRole$1, "__esModule", {
  value: true
});
ImageRole$1.default = void 0;
var ImageRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "img"
    }
  }, {
    module: "HTML",
    concept: {
      name: "img"
    }
  }],
  type: "structure"
};
var _default$1g = ImageRole;
ImageRole$1.default = _default$1g;
var InlineTextBoxRole$1 = {};
Object.defineProperty(InlineTextBoxRole$1, "__esModule", {
  value: true
});
InlineTextBoxRole$1.default = void 0;
var InlineTextBoxRole = {
  relatedConcepts: [{
    module: "HTML",
    concept: {
      name: "input"
    }
  }],
  type: "widget"
};
var _default$1f = InlineTextBoxRole;
InlineTextBoxRole$1.default = _default$1f;
var InputTimeRole$1 = {};
Object.defineProperty(InputTimeRole$1, "__esModule", {
  value: true
});
InputTimeRole$1.default = void 0;
var InputTimeRole = {
  relatedConcepts: [{
    module: "HTML",
    concept: {
      name: "input",
      attributes: [{
        name: "type",
        value: "time"
      }]
    }
  }],
  type: "widget"
};
var _default$1e = InputTimeRole;
InputTimeRole$1.default = _default$1e;
var LabelRole$1 = {};
Object.defineProperty(LabelRole$1, "__esModule", {
  value: true
});
LabelRole$1.default = void 0;
var LabelRole = {
  relatedConcepts: [{
    module: "HTML",
    concept: {
      name: "label"
    }
  }],
  type: "structure"
};
var _default$1d = LabelRole;
LabelRole$1.default = _default$1d;
var LegendRole$1 = {};
Object.defineProperty(LegendRole$1, "__esModule", {
  value: true
});
LegendRole$1.default = void 0;
var LegendRole = {
  relatedConcepts: [{
    module: "HTML",
    concept: {
      name: "legend"
    }
  }],
  type: "structure"
};
var _default$1c = LegendRole;
LegendRole$1.default = _default$1c;
var LineBreakRole$1 = {};
Object.defineProperty(LineBreakRole$1, "__esModule", {
  value: true
});
LineBreakRole$1.default = void 0;
var LineBreakRole = {
  relatedConcepts: [{
    module: "HTML",
    concept: {
      name: "br"
    }
  }],
  type: "structure"
};
var _default$1b = LineBreakRole;
LineBreakRole$1.default = _default$1b;
var LinkRole$1 = {};
Object.defineProperty(LinkRole$1, "__esModule", {
  value: true
});
LinkRole$1.default = void 0;
var LinkRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "link"
    }
  }, {
    module: "HTML",
    concept: {
      name: "a",
      attributes: [{
        name: "href"
      }]
    }
  }],
  type: "widget"
};
var _default$1a = LinkRole;
LinkRole$1.default = _default$1a;
var ListBoxOptionRole$1 = {};
Object.defineProperty(ListBoxOptionRole$1, "__esModule", {
  value: true
});
ListBoxOptionRole$1.default = void 0;
var ListBoxOptionRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "option"
    }
  }, {
    module: "HTML",
    concept: {
      name: "option"
    }
  }],
  type: "widget"
};
var _default$19 = ListBoxOptionRole;
ListBoxOptionRole$1.default = _default$19;
var ListBoxRole$1 = {};
Object.defineProperty(ListBoxRole$1, "__esModule", {
  value: true
});
ListBoxRole$1.default = void 0;
var ListBoxRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "listbox"
    }
  }, {
    module: "HTML",
    concept: {
      name: "datalist"
    }
  }, {
    module: "HTML",
    concept: {
      name: "select"
    }
  }],
  type: "widget"
};
var _default$18 = ListBoxRole;
ListBoxRole$1.default = _default$18;
var ListItemRole$1 = {};
Object.defineProperty(ListItemRole$1, "__esModule", {
  value: true
});
ListItemRole$1.default = void 0;
var ListItemRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "listitem"
    }
  }, {
    module: "HTML",
    concept: {
      name: "li"
    }
  }],
  type: "structure"
};
var _default$17 = ListItemRole;
ListItemRole$1.default = _default$17;
var ListMarkerRole$1 = {};
Object.defineProperty(ListMarkerRole$1, "__esModule", {
  value: true
});
ListMarkerRole$1.default = void 0;
var ListMarkerRole = {
  relatedConcepts: [],
  type: "structure"
};
var _default$16 = ListMarkerRole;
ListMarkerRole$1.default = _default$16;
var ListRole$1 = {};
Object.defineProperty(ListRole$1, "__esModule", {
  value: true
});
ListRole$1.default = void 0;
var ListRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "list"
    }
  }, {
    module: "HTML",
    concept: {
      name: "ul"
    }
  }, {
    module: "HTML",
    concept: {
      name: "ol"
    }
  }],
  type: "structure"
};
var _default$15 = ListRole;
ListRole$1.default = _default$15;
var LogRole$1 = {};
Object.defineProperty(LogRole$1, "__esModule", {
  value: true
});
LogRole$1.default = void 0;
var LogRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "log"
    }
  }],
  type: "structure"
};
var _default$14 = LogRole;
LogRole$1.default = _default$14;
var MainRole$1 = {};
Object.defineProperty(MainRole$1, "__esModule", {
  value: true
});
MainRole$1.default = void 0;
var MainRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "main"
    }
  }, {
    module: "HTML",
    concept: {
      name: "main"
    }
  }],
  type: "structure"
};
var _default$13 = MainRole;
MainRole$1.default = _default$13;
var MarkRole$1 = {};
Object.defineProperty(MarkRole$1, "__esModule", {
  value: true
});
MarkRole$1.default = void 0;
var MarkRole = {
  relatedConcepts: [{
    module: "HTML",
    concept: {
      name: "mark"
    }
  }],
  type: "structure"
};
var _default$12 = MarkRole;
MarkRole$1.default = _default$12;
var MarqueeRole$1 = {};
Object.defineProperty(MarqueeRole$1, "__esModule", {
  value: true
});
MarqueeRole$1.default = void 0;
var MarqueeRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "marquee"
    }
  }, {
    module: "HTML",
    concept: {
      name: "marquee"
    }
  }],
  type: "structure"
};
var _default$11 = MarqueeRole;
MarqueeRole$1.default = _default$11;
var MathRole$1 = {};
Object.defineProperty(MathRole$1, "__esModule", {
  value: true
});
MathRole$1.default = void 0;
var MathRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "math"
    }
  }],
  type: "structure"
};
var _default$10 = MathRole;
MathRole$1.default = _default$10;
var MenuBarRole$1 = {};
Object.defineProperty(MenuBarRole$1, "__esModule", {
  value: true
});
MenuBarRole$1.default = void 0;
var MenuBarRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "menubar"
    }
  }],
  type: "structure"
};
var _default$$ = MenuBarRole;
MenuBarRole$1.default = _default$$;
var MenuButtonRole$1 = {};
Object.defineProperty(MenuButtonRole$1, "__esModule", {
  value: true
});
MenuButtonRole$1.default = void 0;
var MenuButtonRole = {
  relatedConcepts: [],
  type: "widget"
};
var _default$_ = MenuButtonRole;
MenuButtonRole$1.default = _default$_;
var MenuItemRole$1 = {};
Object.defineProperty(MenuItemRole$1, "__esModule", {
  value: true
});
MenuItemRole$1.default = void 0;
var MenuItemRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "menuitem"
    }
  }, {
    module: "HTML",
    concept: {
      name: "menuitem"
    }
  }],
  type: "widget"
};
var _default$Z = MenuItemRole;
MenuItemRole$1.default = _default$Z;
var MenuItemCheckBoxRole$1 = {};
Object.defineProperty(MenuItemCheckBoxRole$1, "__esModule", {
  value: true
});
MenuItemCheckBoxRole$1.default = void 0;
var MenuItemCheckBoxRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "menuitemcheckbox"
    }
  }],
  type: "widget"
};
var _default$Y = MenuItemCheckBoxRole;
MenuItemCheckBoxRole$1.default = _default$Y;
var MenuItemRadioRole$1 = {};
Object.defineProperty(MenuItemRadioRole$1, "__esModule", {
  value: true
});
MenuItemRadioRole$1.default = void 0;
var MenuItemRadioRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "menuitemradio"
    }
  }],
  type: "widget"
};
var _default$X = MenuItemRadioRole;
MenuItemRadioRole$1.default = _default$X;
var MenuListOptionRole$1 = {};
Object.defineProperty(MenuListOptionRole$1, "__esModule", {
  value: true
});
MenuListOptionRole$1.default = void 0;
var MenuListOptionRole = {
  relatedConcepts: [],
  type: "widget"
};
var _default$W = MenuListOptionRole;
MenuListOptionRole$1.default = _default$W;
var MenuListPopupRole$1 = {};
Object.defineProperty(MenuListPopupRole$1, "__esModule", {
  value: true
});
MenuListPopupRole$1.default = void 0;
var MenuListPopupRole = {
  relatedConcepts: [],
  type: "widget"
};
var _default$V = MenuListPopupRole;
MenuListPopupRole$1.default = _default$V;
var MenuRole$1 = {};
Object.defineProperty(MenuRole$1, "__esModule", {
  value: true
});
MenuRole$1.default = void 0;
var MenuRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "menu"
    }
  }, {
    module: "HTML",
    concept: {
      name: "menu"
    }
  }],
  type: "structure"
};
var _default$U = MenuRole;
MenuRole$1.default = _default$U;
var MeterRole$1 = {};
Object.defineProperty(MeterRole$1, "__esModule", {
  value: true
});
MeterRole$1.default = void 0;
var MeterRole = {
  relatedConcepts: [{
    module: "HTML",
    concept: {
      name: "meter"
    }
  }],
  type: "structure"
};
var _default$T = MeterRole;
MeterRole$1.default = _default$T;
var NavigationRole$1 = {};
Object.defineProperty(NavigationRole$1, "__esModule", {
  value: true
});
NavigationRole$1.default = void 0;
var NavigationRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "navigation"
    }
  }, {
    module: "HTML",
    concept: {
      name: "nav"
    }
  }],
  type: "structure"
};
var _default$S = NavigationRole;
NavigationRole$1.default = _default$S;
var NoneRole$1 = {};
Object.defineProperty(NoneRole$1, "__esModule", {
  value: true
});
NoneRole$1.default = void 0;
var NoneRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "none"
    }
  }],
  type: "structure"
};
var _default$R = NoneRole;
NoneRole$1.default = _default$R;
var NoteRole$1 = {};
Object.defineProperty(NoteRole$1, "__esModule", {
  value: true
});
NoteRole$1.default = void 0;
var NoteRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "note"
    }
  }],
  type: "structure"
};
var _default$Q = NoteRole;
NoteRole$1.default = _default$Q;
var OutlineRole$1 = {};
Object.defineProperty(OutlineRole$1, "__esModule", {
  value: true
});
OutlineRole$1.default = void 0;
var OutlineRole = {
  relatedConcepts: [],
  type: "structure"
};
var _default$P = OutlineRole;
OutlineRole$1.default = _default$P;
var ParagraphRole$1 = {};
Object.defineProperty(ParagraphRole$1, "__esModule", {
  value: true
});
ParagraphRole$1.default = void 0;
var ParagraphRole = {
  relatedConcepts: [{
    module: "HTML",
    concept: {
      name: "p"
    }
  }],
  type: "structure"
};
var _default$O = ParagraphRole;
ParagraphRole$1.default = _default$O;
var PopUpButtonRole$1 = {};
Object.defineProperty(PopUpButtonRole$1, "__esModule", {
  value: true
});
PopUpButtonRole$1.default = void 0;
var PopUpButtonRole = {
  relatedConcepts: [],
  type: "widget"
};
var _default$N = PopUpButtonRole;
PopUpButtonRole$1.default = _default$N;
var PreRole$1 = {};
Object.defineProperty(PreRole$1, "__esModule", {
  value: true
});
PreRole$1.default = void 0;
var PreRole = {
  relatedConcepts: [{
    module: "HTML",
    concept: {
      name: "pre"
    }
  }],
  type: "structure"
};
var _default$M = PreRole;
PreRole$1.default = _default$M;
var PresentationalRole$1 = {};
Object.defineProperty(PresentationalRole$1, "__esModule", {
  value: true
});
PresentationalRole$1.default = void 0;
var PresentationalRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "presentation"
    }
  }],
  type: "structure"
};
var _default$L = PresentationalRole;
PresentationalRole$1.default = _default$L;
var ProgressIndicatorRole$1 = {};
Object.defineProperty(ProgressIndicatorRole$1, "__esModule", {
  value: true
});
ProgressIndicatorRole$1.default = void 0;
var ProgressIndicatorRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "progressbar"
    }
  }, {
    module: "HTML",
    concept: {
      name: "progress"
    }
  }],
  type: "structure"
};
var _default$K = ProgressIndicatorRole;
ProgressIndicatorRole$1.default = _default$K;
var RadioButtonRole$1 = {};
Object.defineProperty(RadioButtonRole$1, "__esModule", {
  value: true
});
RadioButtonRole$1.default = void 0;
var RadioButtonRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "radio"
    }
  }, {
    module: "HTML",
    concept: {
      name: "input",
      attributes: [{
        name: "type",
        value: "radio"
      }]
    }
  }],
  type: "widget"
};
var _default$J = RadioButtonRole;
RadioButtonRole$1.default = _default$J;
var RadioGroupRole$1 = {};
Object.defineProperty(RadioGroupRole$1, "__esModule", {
  value: true
});
RadioGroupRole$1.default = void 0;
var RadioGroupRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "radiogroup"
    }
  }],
  type: "structure"
};
var _default$I = RadioGroupRole;
RadioGroupRole$1.default = _default$I;
var RegionRole$1 = {};
Object.defineProperty(RegionRole$1, "__esModule", {
  value: true
});
RegionRole$1.default = void 0;
var RegionRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "region"
    }
  }],
  type: "structure"
};
var _default$H = RegionRole;
RegionRole$1.default = _default$H;
var RootWebAreaRole$1 = {};
Object.defineProperty(RootWebAreaRole$1, "__esModule", {
  value: true
});
RootWebAreaRole$1.default = void 0;
var RootWebAreaRole = {
  relatedConcepts: [],
  type: "structure"
};
var _default$G = RootWebAreaRole;
RootWebAreaRole$1.default = _default$G;
var RowHeaderRole$1 = {};
Object.defineProperty(RowHeaderRole$1, "__esModule", {
  value: true
});
RowHeaderRole$1.default = void 0;
var RowHeaderRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "rowheader"
    }
  }, {
    module: "HTML",
    concept: {
      name: "th",
      attributes: [{
        name: "scope",
        value: "row"
      }]
    }
  }],
  type: "widget"
};
var _default$F = RowHeaderRole;
RowHeaderRole$1.default = _default$F;
var RowRole$1 = {};
Object.defineProperty(RowRole$1, "__esModule", {
  value: true
});
RowRole$1.default = void 0;
var RowRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "row"
    }
  }, {
    module: "HTML",
    concept: {
      name: "tr"
    }
  }],
  type: "structure"
};
var _default$E = RowRole;
RowRole$1.default = _default$E;
var RubyRole$1 = {};
Object.defineProperty(RubyRole$1, "__esModule", {
  value: true
});
RubyRole$1.default = void 0;
var RubyRole = {
  relatedConcepts: [{
    module: "HTML",
    concept: {
      name: "ruby"
    }
  }],
  type: "structure"
};
var _default$D = RubyRole;
RubyRole$1.default = _default$D;
var RulerRole$1 = {};
Object.defineProperty(RulerRole$1, "__esModule", {
  value: true
});
RulerRole$1.default = void 0;
var RulerRole = {
  relatedConcepts: [],
  type: "structure"
};
var _default$C = RulerRole;
RulerRole$1.default = _default$C;
var ScrollAreaRole$1 = {};
Object.defineProperty(ScrollAreaRole$1, "__esModule", {
  value: true
});
ScrollAreaRole$1.default = void 0;
var ScrollAreaRole = {
  relatedConcepts: [],
  type: "structure"
};
var _default$B = ScrollAreaRole;
ScrollAreaRole$1.default = _default$B;
var ScrollBarRole$1 = {};
Object.defineProperty(ScrollBarRole$1, "__esModule", {
  value: true
});
ScrollBarRole$1.default = void 0;
var ScrollBarRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "scrollbar"
    }
  }],
  type: "widget"
};
var _default$A = ScrollBarRole;
ScrollBarRole$1.default = _default$A;
var SeamlessWebAreaRole$1 = {};
Object.defineProperty(SeamlessWebAreaRole$1, "__esModule", {
  value: true
});
SeamlessWebAreaRole$1.default = void 0;
var SeamlessWebAreaRole = {
  relatedConcepts: [],
  type: "structure"
};
var _default$z = SeamlessWebAreaRole;
SeamlessWebAreaRole$1.default = _default$z;
var SearchRole$1 = {};
Object.defineProperty(SearchRole$1, "__esModule", {
  value: true
});
SearchRole$1.default = void 0;
var SearchRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "search"
    }
  }],
  type: "structure"
};
var _default$y = SearchRole;
SearchRole$1.default = _default$y;
var SearchBoxRole$1 = {};
Object.defineProperty(SearchBoxRole$1, "__esModule", {
  value: true
});
SearchBoxRole$1.default = void 0;
var SearchBoxRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "searchbox"
    }
  }, {
    module: "HTML",
    concept: {
      name: "input",
      attributes: [{
        name: "type",
        value: "search"
      }]
    }
  }],
  type: "widget"
};
var _default$x = SearchBoxRole;
SearchBoxRole$1.default = _default$x;
var SliderRole$1 = {};
Object.defineProperty(SliderRole$1, "__esModule", {
  value: true
});
SliderRole$1.default = void 0;
var SliderRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "slider"
    }
  }, {
    module: "HTML",
    concept: {
      name: "input",
      attributes: [{
        name: "type",
        value: "range"
      }]
    }
  }],
  type: "widget"
};
var _default$w = SliderRole;
SliderRole$1.default = _default$w;
var SliderThumbRole$1 = {};
Object.defineProperty(SliderThumbRole$1, "__esModule", {
  value: true
});
SliderThumbRole$1.default = void 0;
var SliderThumbRole = {
  relatedConcepts: [],
  type: "structure"
};
var _default$v = SliderThumbRole;
SliderThumbRole$1.default = _default$v;
var SpinButtonRole$1 = {};
Object.defineProperty(SpinButtonRole$1, "__esModule", {
  value: true
});
SpinButtonRole$1.default = void 0;
var SpinButtonRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "spinbutton"
    }
  }, {
    module: "HTML",
    concept: {
      name: "input",
      attributes: [{
        name: "type",
        value: "number"
      }]
    }
  }],
  type: "widget"
};
var _default$u = SpinButtonRole;
SpinButtonRole$1.default = _default$u;
var SpinButtonPartRole$1 = {};
Object.defineProperty(SpinButtonPartRole$1, "__esModule", {
  value: true
});
SpinButtonPartRole$1.default = void 0;
var SpinButtonPartRole = {
  relatedConcepts: [],
  type: "structure"
};
var _default$t = SpinButtonPartRole;
SpinButtonPartRole$1.default = _default$t;
var SplitterRole$1 = {};
Object.defineProperty(SplitterRole$1, "__esModule", {
  value: true
});
SplitterRole$1.default = void 0;
var SplitterRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "separator"
    }
  }],
  type: "widget"
};
var _default$s = SplitterRole;
SplitterRole$1.default = _default$s;
var StaticTextRole$1 = {};
Object.defineProperty(StaticTextRole$1, "__esModule", {
  value: true
});
StaticTextRole$1.default = void 0;
var StaticTextRole = {
  relatedConcepts: [],
  type: "structure"
};
var _default$r = StaticTextRole;
StaticTextRole$1.default = _default$r;
var StatusRole$1 = {};
Object.defineProperty(StatusRole$1, "__esModule", {
  value: true
});
StatusRole$1.default = void 0;
var StatusRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "status"
    }
  }],
  type: "structure"
};
var _default$q = StatusRole;
StatusRole$1.default = _default$q;
var SVGRootRole$1 = {};
Object.defineProperty(SVGRootRole$1, "__esModule", {
  value: true
});
SVGRootRole$1.default = void 0;
var SVGRootRole = {
  relatedConcepts: [],
  type: "structure"
};
var _default$p = SVGRootRole;
SVGRootRole$1.default = _default$p;
var SwitchRole$1 = {};
Object.defineProperty(SwitchRole$1, "__esModule", {
  value: true
});
SwitchRole$1.default = void 0;
var SwitchRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "switch"
    }
  }, {
    module: "HTML",
    concept: {
      name: "input",
      attributes: [{
        name: "type",
        value: "checkbox"
      }]
    }
  }],
  type: "widget"
};
var _default$o = SwitchRole;
SwitchRole$1.default = _default$o;
var TabGroupRole$1 = {};
Object.defineProperty(TabGroupRole$1, "__esModule", {
  value: true
});
TabGroupRole$1.default = void 0;
var TabGroupRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "tablist"
    }
  }],
  type: "structure"
};
var _default$n = TabGroupRole;
TabGroupRole$1.default = _default$n;
var TabRole$1 = {};
Object.defineProperty(TabRole$1, "__esModule", {
  value: true
});
TabRole$1.default = void 0;
var TabRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "tab"
    }
  }],
  type: "widget"
};
var _default$m = TabRole;
TabRole$1.default = _default$m;
var TableHeaderContainerRole$1 = {};
Object.defineProperty(TableHeaderContainerRole$1, "__esModule", {
  value: true
});
TableHeaderContainerRole$1.default = void 0;
var TableHeaderContainerRole = {
  relatedConcepts: [],
  type: "structure"
};
var _default$l = TableHeaderContainerRole;
TableHeaderContainerRole$1.default = _default$l;
var TableRole$1 = {};
Object.defineProperty(TableRole$1, "__esModule", {
  value: true
});
TableRole$1.default = void 0;
var TableRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "table"
    }
  }, {
    module: "HTML",
    concept: {
      name: "table"
    }
  }],
  type: "structure"
};
var _default$k = TableRole;
TableRole$1.default = _default$k;
var TabListRole$1 = {};
Object.defineProperty(TabListRole$1, "__esModule", {
  value: true
});
TabListRole$1.default = void 0;
var TabListRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "tablist"
    }
  }],
  type: "structure"
};
var _default$j = TabListRole;
TabListRole$1.default = _default$j;
var TabPanelRole$1 = {};
Object.defineProperty(TabPanelRole$1, "__esModule", {
  value: true
});
TabPanelRole$1.default = void 0;
var TabPanelRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "tabpanel"
    }
  }],
  type: "structure"
};
var _default$i = TabPanelRole;
TabPanelRole$1.default = _default$i;
var TermRole$1 = {};
Object.defineProperty(TermRole$1, "__esModule", {
  value: true
});
TermRole$1.default = void 0;
var TermRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "term"
    }
  }],
  type: "structure"
};
var _default$h = TermRole;
TermRole$1.default = _default$h;
var TextAreaRole$1 = {};
Object.defineProperty(TextAreaRole$1, "__esModule", {
  value: true
});
TextAreaRole$1.default = void 0;
var TextAreaRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      attributes: [{
        name: "aria-multiline",
        value: "true"
      }],
      name: "textbox"
    }
  }, {
    module: "HTML",
    concept: {
      name: "textarea"
    }
  }],
  type: "widget"
};
var _default$g = TextAreaRole;
TextAreaRole$1.default = _default$g;
var TextFieldRole$1 = {};
Object.defineProperty(TextFieldRole$1, "__esModule", {
  value: true
});
TextFieldRole$1.default = void 0;
var TextFieldRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "textbox"
    }
  }, {
    module: "HTML",
    concept: {
      name: "input"
    }
  }, {
    module: "HTML",
    concept: {
      name: "input",
      attributes: [{
        name: "type",
        value: "text"
      }]
    }
  }],
  type: "widget"
};
var _default$f = TextFieldRole;
TextFieldRole$1.default = _default$f;
var TimeRole$1 = {};
Object.defineProperty(TimeRole$1, "__esModule", {
  value: true
});
TimeRole$1.default = void 0;
var TimeRole = {
  relatedConcepts: [{
    module: "HTML",
    concept: {
      name: "time"
    }
  }],
  type: "structure"
};
var _default$e = TimeRole;
TimeRole$1.default = _default$e;
var TimerRole$1 = {};
Object.defineProperty(TimerRole$1, "__esModule", {
  value: true
});
TimerRole$1.default = void 0;
var TimerRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "timer"
    }
  }],
  type: "structure"
};
var _default$d = TimerRole;
TimerRole$1.default = _default$d;
var ToggleButtonRole$1 = {};
Object.defineProperty(ToggleButtonRole$1, "__esModule", {
  value: true
});
ToggleButtonRole$1.default = void 0;
var ToggleButtonRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      attributes: [{
        name: "aria-pressed"
      }]
    }
  }],
  type: "widget"
};
var _default$c = ToggleButtonRole;
ToggleButtonRole$1.default = _default$c;
var ToolbarRole$1 = {};
Object.defineProperty(ToolbarRole$1, "__esModule", {
  value: true
});
ToolbarRole$1.default = void 0;
var ToolbarRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "toolbar"
    }
  }],
  type: "structure"
};
var _default$b = ToolbarRole;
ToolbarRole$1.default = _default$b;
var TreeRole$1 = {};
Object.defineProperty(TreeRole$1, "__esModule", {
  value: true
});
TreeRole$1.default = void 0;
var TreeRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "tree"
    }
  }],
  type: "widget"
};
var _default$a = TreeRole;
TreeRole$1.default = _default$a;
var TreeGridRole$1 = {};
Object.defineProperty(TreeGridRole$1, "__esModule", {
  value: true
});
TreeGridRole$1.default = void 0;
var TreeGridRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "treegrid"
    }
  }],
  type: "widget"
};
var _default$9 = TreeGridRole;
TreeGridRole$1.default = _default$9;
var TreeItemRole$1 = {};
Object.defineProperty(TreeItemRole$1, "__esModule", {
  value: true
});
TreeItemRole$1.default = void 0;
var TreeItemRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "treeitem"
    }
  }],
  type: "widget"
};
var _default$8 = TreeItemRole;
TreeItemRole$1.default = _default$8;
var UserInterfaceTooltipRole$1 = {};
Object.defineProperty(UserInterfaceTooltipRole$1, "__esModule", {
  value: true
});
UserInterfaceTooltipRole$1.default = void 0;
var UserInterfaceTooltipRole = {
  relatedConcepts: [{
    module: "ARIA",
    concept: {
      name: "tooltip"
    }
  }],
  type: "structure"
};
var _default$7 = UserInterfaceTooltipRole;
UserInterfaceTooltipRole$1.default = _default$7;
var VideoRole$1 = {};
Object.defineProperty(VideoRole$1, "__esModule", {
  value: true
});
VideoRole$1.default = void 0;
var VideoRole = {
  relatedConcepts: [{
    module: "HTML",
    concept: {
      name: "video"
    }
  }],
  type: "widget"
};
var _default$6 = VideoRole;
VideoRole$1.default = _default$6;
var WebAreaRole$1 = {};
Object.defineProperty(WebAreaRole$1, "__esModule", {
  value: true
});
WebAreaRole$1.default = void 0;
var WebAreaRole = {
  relatedConcepts: [],
  type: "structure"
};
var _default$5 = WebAreaRole;
WebAreaRole$1.default = _default$5;
var WindowRole$1 = {};
Object.defineProperty(WindowRole$1, "__esModule", {
  value: true
});
WindowRole$1.default = void 0;
var WindowRole = {
  relatedConcepts: [],
  type: "window"
};
var _default$4 = WindowRole;
WindowRole$1.default = _default$4;
Object.defineProperty(AXObjectsMap$1, "__esModule", {
  value: true
});
AXObjectsMap$1.default = void 0;
var _iterationDecorator$3 = _interopRequireDefault$4(iterationDecorator$1);
var _AbbrRole = _interopRequireDefault$4(AbbrRole$1);
var _AlertDialogRole = _interopRequireDefault$4(AlertDialogRole$1);
var _AlertRole = _interopRequireDefault$4(AlertRole$1);
var _AnnotationRole = _interopRequireDefault$4(AnnotationRole$1);
var _ApplicationRole = _interopRequireDefault$4(ApplicationRole$1);
var _ArticleRole = _interopRequireDefault$4(ArticleRole$1);
var _AudioRole = _interopRequireDefault$4(AudioRole$1);
var _BannerRole = _interopRequireDefault$4(BannerRole$1);
var _BlockquoteRole = _interopRequireDefault$4(BlockquoteRole$1);
var _BusyIndicatorRole = _interopRequireDefault$4(BusyIndicatorRole$1);
var _ButtonRole = _interopRequireDefault$4(ButtonRole$1);
var _CanvasRole = _interopRequireDefault$4(CanvasRole$1);
var _CaptionRole = _interopRequireDefault$4(CaptionRole$1);
var _CellRole = _interopRequireDefault$4(CellRole$1);
var _CheckBoxRole = _interopRequireDefault$4(CheckBoxRole$1);
var _ColorWellRole = _interopRequireDefault$4(ColorWellRole$1);
var _ColumnHeaderRole = _interopRequireDefault$4(ColumnHeaderRole$1);
var _ColumnRole = _interopRequireDefault$4(ColumnRole$1);
var _ComboBoxRole = _interopRequireDefault$4(ComboBoxRole$1);
var _ComplementaryRole = _interopRequireDefault$4(ComplementaryRole$1);
var _ContentInfoRole = _interopRequireDefault$4(ContentInfoRole$1);
var _DateRole = _interopRequireDefault$4(DateRole$1);
var _DateTimeRole = _interopRequireDefault$4(DateTimeRole$1);
var _DefinitionRole = _interopRequireDefault$4(DefinitionRole$1);
var _DescriptionListDetailRole = _interopRequireDefault$4(DescriptionListDetailRole$1);
var _DescriptionListRole = _interopRequireDefault$4(DescriptionListRole$1);
var _DescriptionListTermRole = _interopRequireDefault$4(DescriptionListTermRole$1);
var _DetailsRole = _interopRequireDefault$4(DetailsRole$1);
var _DialogRole = _interopRequireDefault$4(DialogRole$1);
var _DirectoryRole = _interopRequireDefault$4(DirectoryRole$1);
var _DisclosureTriangleRole = _interopRequireDefault$4(DisclosureTriangleRole$1);
var _DivRole = _interopRequireDefault$4(DivRole$1);
var _DocumentRole = _interopRequireDefault$4(DocumentRole$1);
var _EmbeddedObjectRole = _interopRequireDefault$4(EmbeddedObjectRole$1);
var _FeedRole = _interopRequireDefault$4(FeedRole$1);
var _FigcaptionRole = _interopRequireDefault$4(FigcaptionRole$1);
var _FigureRole = _interopRequireDefault$4(FigureRole$1);
var _FooterRole = _interopRequireDefault$4(FooterRole$1);
var _FormRole = _interopRequireDefault$4(FormRole$1);
var _GridRole = _interopRequireDefault$4(GridRole$1);
var _GroupRole = _interopRequireDefault$4(GroupRole$1);
var _HeadingRole = _interopRequireDefault$4(HeadingRole$1);
var _IframePresentationalRole = _interopRequireDefault$4(IframePresentationalRole$1);
var _IframeRole = _interopRequireDefault$4(IframeRole$1);
var _IgnoredRole = _interopRequireDefault$4(IgnoredRole$1);
var _ImageMapLinkRole = _interopRequireDefault$4(ImageMapLinkRole$1);
var _ImageMapRole = _interopRequireDefault$4(ImageMapRole$1);
var _ImageRole = _interopRequireDefault$4(ImageRole$1);
var _InlineTextBoxRole = _interopRequireDefault$4(InlineTextBoxRole$1);
var _InputTimeRole = _interopRequireDefault$4(InputTimeRole$1);
var _LabelRole = _interopRequireDefault$4(LabelRole$1);
var _LegendRole = _interopRequireDefault$4(LegendRole$1);
var _LineBreakRole = _interopRequireDefault$4(LineBreakRole$1);
var _LinkRole = _interopRequireDefault$4(LinkRole$1);
var _ListBoxOptionRole = _interopRequireDefault$4(ListBoxOptionRole$1);
var _ListBoxRole = _interopRequireDefault$4(ListBoxRole$1);
var _ListItemRole = _interopRequireDefault$4(ListItemRole$1);
var _ListMarkerRole = _interopRequireDefault$4(ListMarkerRole$1);
var _ListRole = _interopRequireDefault$4(ListRole$1);
var _LogRole = _interopRequireDefault$4(LogRole$1);
var _MainRole = _interopRequireDefault$4(MainRole$1);
var _MarkRole = _interopRequireDefault$4(MarkRole$1);
var _MarqueeRole = _interopRequireDefault$4(MarqueeRole$1);
var _MathRole = _interopRequireDefault$4(MathRole$1);
var _MenuBarRole = _interopRequireDefault$4(MenuBarRole$1);
var _MenuButtonRole = _interopRequireDefault$4(MenuButtonRole$1);
var _MenuItemRole = _interopRequireDefault$4(MenuItemRole$1);
var _MenuItemCheckBoxRole = _interopRequireDefault$4(MenuItemCheckBoxRole$1);
var _MenuItemRadioRole = _interopRequireDefault$4(MenuItemRadioRole$1);
var _MenuListOptionRole = _interopRequireDefault$4(MenuListOptionRole$1);
var _MenuListPopupRole = _interopRequireDefault$4(MenuListPopupRole$1);
var _MenuRole = _interopRequireDefault$4(MenuRole$1);
var _MeterRole = _interopRequireDefault$4(MeterRole$1);
var _NavigationRole = _interopRequireDefault$4(NavigationRole$1);
var _NoneRole = _interopRequireDefault$4(NoneRole$1);
var _NoteRole = _interopRequireDefault$4(NoteRole$1);
var _OutlineRole = _interopRequireDefault$4(OutlineRole$1);
var _ParagraphRole = _interopRequireDefault$4(ParagraphRole$1);
var _PopUpButtonRole = _interopRequireDefault$4(PopUpButtonRole$1);
var _PreRole = _interopRequireDefault$4(PreRole$1);
var _PresentationalRole = _interopRequireDefault$4(PresentationalRole$1);
var _ProgressIndicatorRole = _interopRequireDefault$4(ProgressIndicatorRole$1);
var _RadioButtonRole = _interopRequireDefault$4(RadioButtonRole$1);
var _RadioGroupRole = _interopRequireDefault$4(RadioGroupRole$1);
var _RegionRole = _interopRequireDefault$4(RegionRole$1);
var _RootWebAreaRole = _interopRequireDefault$4(RootWebAreaRole$1);
var _RowHeaderRole = _interopRequireDefault$4(RowHeaderRole$1);
var _RowRole = _interopRequireDefault$4(RowRole$1);
var _RubyRole = _interopRequireDefault$4(RubyRole$1);
var _RulerRole = _interopRequireDefault$4(RulerRole$1);
var _ScrollAreaRole = _interopRequireDefault$4(ScrollAreaRole$1);
var _ScrollBarRole = _interopRequireDefault$4(ScrollBarRole$1);
var _SeamlessWebAreaRole = _interopRequireDefault$4(SeamlessWebAreaRole$1);
var _SearchRole = _interopRequireDefault$4(SearchRole$1);
var _SearchBoxRole = _interopRequireDefault$4(SearchBoxRole$1);
var _SliderRole = _interopRequireDefault$4(SliderRole$1);
var _SliderThumbRole = _interopRequireDefault$4(SliderThumbRole$1);
var _SpinButtonRole = _interopRequireDefault$4(SpinButtonRole$1);
var _SpinButtonPartRole = _interopRequireDefault$4(SpinButtonPartRole$1);
var _SplitterRole = _interopRequireDefault$4(SplitterRole$1);
var _StaticTextRole = _interopRequireDefault$4(StaticTextRole$1);
var _StatusRole = _interopRequireDefault$4(StatusRole$1);
var _SVGRootRole = _interopRequireDefault$4(SVGRootRole$1);
var _SwitchRole = _interopRequireDefault$4(SwitchRole$1);
var _TabGroupRole = _interopRequireDefault$4(TabGroupRole$1);
var _TabRole = _interopRequireDefault$4(TabRole$1);
var _TableHeaderContainerRole = _interopRequireDefault$4(TableHeaderContainerRole$1);
var _TableRole = _interopRequireDefault$4(TableRole$1);
var _TabListRole = _interopRequireDefault$4(TabListRole$1);
var _TabPanelRole = _interopRequireDefault$4(TabPanelRole$1);
var _TermRole = _interopRequireDefault$4(TermRole$1);
var _TextAreaRole = _interopRequireDefault$4(TextAreaRole$1);
var _TextFieldRole = _interopRequireDefault$4(TextFieldRole$1);
var _TimeRole = _interopRequireDefault$4(TimeRole$1);
var _TimerRole = _interopRequireDefault$4(TimerRole$1);
var _ToggleButtonRole = _interopRequireDefault$4(ToggleButtonRole$1);
var _ToolbarRole = _interopRequireDefault$4(ToolbarRole$1);
var _TreeRole = _interopRequireDefault$4(TreeRole$1);
var _TreeGridRole = _interopRequireDefault$4(TreeGridRole$1);
var _TreeItemRole = _interopRequireDefault$4(TreeItemRole$1);
var _UserInterfaceTooltipRole = _interopRequireDefault$4(UserInterfaceTooltipRole$1);
var _VideoRole = _interopRequireDefault$4(VideoRole$1);
var _WebAreaRole = _interopRequireDefault$4(WebAreaRole$1);
var _WindowRole = _interopRequireDefault$4(WindowRole$1);
function _interopRequireDefault$4(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}
function _slicedToArray$3(arr, i) {
  return _arrayWithHoles$3(arr) || _iterableToArrayLimit$3(arr, i) || _unsupportedIterableToArray$3(arr, i) || _nonIterableRest$3();
}
function _nonIterableRest$3() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _unsupportedIterableToArray$3(o2, minLen) {
  if (!o2) return;
  if (typeof o2 === "string") return _arrayLikeToArray$3(o2, minLen);
  var n2 = Object.prototype.toString.call(o2).slice(8, -1);
  if (n2 === "Object" && o2.constructor) n2 = o2.constructor.name;
  if (n2 === "Map" || n2 === "Set") return Array.from(o2);
  if (n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2)) return _arrayLikeToArray$3(o2, minLen);
}
function _arrayLikeToArray$3(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) {
    arr2[i] = arr[i];
  }
  return arr2;
}
function _iterableToArrayLimit$3(arr, i) {
  var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
  if (_i == null) return;
  var _arr = [];
  var _n = true;
  var _d = false;
  var _s, _e;
  try {
    for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);
      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }
  return _arr;
}
function _arrayWithHoles$3(arr) {
  if (Array.isArray(arr)) return arr;
}
var AXObjects$1 = [["AbbrRole", _AbbrRole.default], ["AlertDialogRole", _AlertDialogRole.default], ["AlertRole", _AlertRole.default], ["AnnotationRole", _AnnotationRole.default], ["ApplicationRole", _ApplicationRole.default], ["ArticleRole", _ArticleRole.default], ["AudioRole", _AudioRole.default], ["BannerRole", _BannerRole.default], ["BlockquoteRole", _BlockquoteRole.default], ["BusyIndicatorRole", _BusyIndicatorRole.default], ["ButtonRole", _ButtonRole.default], ["CanvasRole", _CanvasRole.default], ["CaptionRole", _CaptionRole.default], ["CellRole", _CellRole.default], ["CheckBoxRole", _CheckBoxRole.default], ["ColorWellRole", _ColorWellRole.default], ["ColumnHeaderRole", _ColumnHeaderRole.default], ["ColumnRole", _ColumnRole.default], ["ComboBoxRole", _ComboBoxRole.default], ["ComplementaryRole", _ComplementaryRole.default], ["ContentInfoRole", _ContentInfoRole.default], ["DateRole", _DateRole.default], ["DateTimeRole", _DateTimeRole.default], ["DefinitionRole", _DefinitionRole.default], ["DescriptionListDetailRole", _DescriptionListDetailRole.default], ["DescriptionListRole", _DescriptionListRole.default], ["DescriptionListTermRole", _DescriptionListTermRole.default], ["DetailsRole", _DetailsRole.default], ["DialogRole", _DialogRole.default], ["DirectoryRole", _DirectoryRole.default], ["DisclosureTriangleRole", _DisclosureTriangleRole.default], ["DivRole", _DivRole.default], ["DocumentRole", _DocumentRole.default], ["EmbeddedObjectRole", _EmbeddedObjectRole.default], ["FeedRole", _FeedRole.default], ["FigcaptionRole", _FigcaptionRole.default], ["FigureRole", _FigureRole.default], ["FooterRole", _FooterRole.default], ["FormRole", _FormRole.default], ["GridRole", _GridRole.default], ["GroupRole", _GroupRole.default], ["HeadingRole", _HeadingRole.default], ["IframePresentationalRole", _IframePresentationalRole.default], ["IframeRole", _IframeRole.default], ["IgnoredRole", _IgnoredRole.default], ["ImageMapLinkRole", _ImageMapLinkRole.default], ["ImageMapRole", _ImageMapRole.default], ["ImageRole", _ImageRole.default], ["InlineTextBoxRole", _InlineTextBoxRole.default], ["InputTimeRole", _InputTimeRole.default], ["LabelRole", _LabelRole.default], ["LegendRole", _LegendRole.default], ["LineBreakRole", _LineBreakRole.default], ["LinkRole", _LinkRole.default], ["ListBoxOptionRole", _ListBoxOptionRole.default], ["ListBoxRole", _ListBoxRole.default], ["ListItemRole", _ListItemRole.default], ["ListMarkerRole", _ListMarkerRole.default], ["ListRole", _ListRole.default], ["LogRole", _LogRole.default], ["MainRole", _MainRole.default], ["MarkRole", _MarkRole.default], ["MarqueeRole", _MarqueeRole.default], ["MathRole", _MathRole.default], ["MenuBarRole", _MenuBarRole.default], ["MenuButtonRole", _MenuButtonRole.default], ["MenuItemRole", _MenuItemRole.default], ["MenuItemCheckBoxRole", _MenuItemCheckBoxRole.default], ["MenuItemRadioRole", _MenuItemRadioRole.default], ["MenuListOptionRole", _MenuListOptionRole.default], ["MenuListPopupRole", _MenuListPopupRole.default], ["MenuRole", _MenuRole.default], ["MeterRole", _MeterRole.default], ["NavigationRole", _NavigationRole.default], ["NoneRole", _NoneRole.default], ["NoteRole", _NoteRole.default], ["OutlineRole", _OutlineRole.default], ["ParagraphRole", _ParagraphRole.default], ["PopUpButtonRole", _PopUpButtonRole.default], ["PreRole", _PreRole.default], ["PresentationalRole", _PresentationalRole.default], ["ProgressIndicatorRole", _ProgressIndicatorRole.default], ["RadioButtonRole", _RadioButtonRole.default], ["RadioGroupRole", _RadioGroupRole.default], ["RegionRole", _RegionRole.default], ["RootWebAreaRole", _RootWebAreaRole.default], ["RowHeaderRole", _RowHeaderRole.default], ["RowRole", _RowRole.default], ["RubyRole", _RubyRole.default], ["RulerRole", _RulerRole.default], ["ScrollAreaRole", _ScrollAreaRole.default], ["ScrollBarRole", _ScrollBarRole.default], ["SeamlessWebAreaRole", _SeamlessWebAreaRole.default], ["SearchRole", _SearchRole.default], ["SearchBoxRole", _SearchBoxRole.default], ["SliderRole", _SliderRole.default], ["SliderThumbRole", _SliderThumbRole.default], ["SpinButtonRole", _SpinButtonRole.default], ["SpinButtonPartRole", _SpinButtonPartRole.default], ["SplitterRole", _SplitterRole.default], ["StaticTextRole", _StaticTextRole.default], ["StatusRole", _StatusRole.default], ["SVGRootRole", _SVGRootRole.default], ["SwitchRole", _SwitchRole.default], ["TabGroupRole", _TabGroupRole.default], ["TabRole", _TabRole.default], ["TableHeaderContainerRole", _TableHeaderContainerRole.default], ["TableRole", _TableRole.default], ["TabListRole", _TabListRole.default], ["TabPanelRole", _TabPanelRole.default], ["TermRole", _TermRole.default], ["TextAreaRole", _TextAreaRole.default], ["TextFieldRole", _TextFieldRole.default], ["TimeRole", _TimeRole.default], ["TimerRole", _TimerRole.default], ["ToggleButtonRole", _ToggleButtonRole.default], ["ToolbarRole", _ToolbarRole.default], ["TreeRole", _TreeRole.default], ["TreeGridRole", _TreeGridRole.default], ["TreeItemRole", _TreeItemRole.default], ["UserInterfaceTooltipRole", _UserInterfaceTooltipRole.default], ["VideoRole", _VideoRole.default], ["WebAreaRole", _WebAreaRole.default], ["WindowRole", _WindowRole.default]];
var AXObjectsMap = {
  entries: function entries6() {
    return AXObjects$1;
  },
  forEach: function forEach6(fn) {
    var thisArg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
    for (var _i = 0, _AXObjects = AXObjects$1; _i < _AXObjects.length; _i++) {
      var _AXObjects$_i = _slicedToArray$3(_AXObjects[_i], 2), key = _AXObjects$_i[0], values10 = _AXObjects$_i[1];
      fn.call(thisArg, values10, key, AXObjects$1);
    }
  },
  get: function get6(key) {
    var item = AXObjects$1.find(function(tuple) {
      return tuple[0] === key ? true : false;
    });
    return item && item[1];
  },
  has: function has6(key) {
    return !!AXObjectsMap.get(key);
  },
  keys: function keys7() {
    return AXObjects$1.map(function(_ref) {
      var _ref2 = _slicedToArray$3(_ref, 1), key = _ref2[0];
      return key;
    });
  },
  values: function values6() {
    return AXObjects$1.map(function(_ref3) {
      var _ref4 = _slicedToArray$3(_ref3, 2), values10 = _ref4[1];
      return values10;
    });
  }
};
var _default$3 = (0, _iterationDecorator$3.default)(AXObjectsMap, AXObjectsMap.entries());
AXObjectsMap$1.default = _default$3;
Object.defineProperty(AXObjectElementMap$1, "__esModule", {
  value: true
});
AXObjectElementMap$1.default = void 0;
var _iterationDecorator$2 = _interopRequireDefault$3(iterationDecorator$1);
var _AXObjectsMap$3 = _interopRequireDefault$3(AXObjectsMap$1);
function _interopRequireDefault$3(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}
function _slicedToArray$2(arr, i) {
  return _arrayWithHoles$2(arr) || _iterableToArrayLimit$2(arr, i) || _unsupportedIterableToArray$2(arr, i) || _nonIterableRest$2();
}
function _nonIterableRest$2() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _iterableToArrayLimit$2(arr, i) {
  var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
  if (_i == null) return;
  var _arr = [];
  var _n = true;
  var _d = false;
  var _s, _e;
  try {
    for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);
      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }
  return _arr;
}
function _arrayWithHoles$2(arr) {
  if (Array.isArray(arr)) return arr;
}
function _createForOfIteratorHelper$2(o2, allowArrayLike) {
  var it = typeof Symbol !== "undefined" && o2[Symbol.iterator] || o2["@@iterator"];
  if (!it) {
    if (Array.isArray(o2) || (it = _unsupportedIterableToArray$2(o2)) || allowArrayLike) {
      if (it) o2 = it;
      var i = 0;
      var F = function F2() {
      };
      return { s: F, n: function n2() {
        if (i >= o2.length) return { done: true };
        return { done: false, value: o2[i++] };
      }, e: function e2(_e2) {
        throw _e2;
      }, f: F };
    }
    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  var normalCompletion = true, didErr = false, err;
  return { s: function s() {
    it = it.call(o2);
  }, n: function n2() {
    var step = it.next();
    normalCompletion = step.done;
    return step;
  }, e: function e2(_e3) {
    didErr = true;
    err = _e3;
  }, f: function f2() {
    try {
      if (!normalCompletion && it.return != null) it.return();
    } finally {
      if (didErr) throw err;
    }
  } };
}
function _unsupportedIterableToArray$2(o2, minLen) {
  if (!o2) return;
  if (typeof o2 === "string") return _arrayLikeToArray$2(o2, minLen);
  var n2 = Object.prototype.toString.call(o2).slice(8, -1);
  if (n2 === "Object" && o2.constructor) n2 = o2.constructor.name;
  if (n2 === "Map" || n2 === "Set") return Array.from(o2);
  if (n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2)) return _arrayLikeToArray$2(o2, minLen);
}
function _arrayLikeToArray$2(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) {
    arr2[i] = arr[i];
  }
  return arr2;
}
var AXObjectElements$1 = [];
var _iterator$2 = _createForOfIteratorHelper$2(_AXObjectsMap$3.default.entries()), _step$2;
try {
  var _loop$2 = function _loop() {
    var _step$value = _slicedToArray$2(_step$2.value, 2), name = _step$value[0], def = _step$value[1];
    var relatedConcepts = def.relatedConcepts;
    if (Array.isArray(relatedConcepts)) {
      relatedConcepts.forEach(function(relation) {
        if (relation.module === "HTML") {
          var concept = relation.concept;
          if (concept) {
            var index2 = AXObjectElements$1.findIndex(function(_ref5) {
              var _ref6 = _slicedToArray$2(_ref5, 1), key = _ref6[0];
              return key === name;
            });
            if (index2 === -1) {
              AXObjectElements$1.push([name, []]);
              index2 = AXObjectElements$1.length - 1;
            }
            AXObjectElements$1[index2][1].push(concept);
          }
        }
      });
    }
  };
  for (_iterator$2.s(); !(_step$2 = _iterator$2.n()).done; ) {
    _loop$2();
  }
} catch (err) {
  _iterator$2.e(err);
} finally {
  _iterator$2.f();
}
var AXObjectElementMap = {
  entries: function entries7() {
    return AXObjectElements$1;
  },
  forEach: function forEach7(fn) {
    var thisArg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
    for (var _i = 0, _AXObjectElements = AXObjectElements$1; _i < _AXObjectElements.length; _i++) {
      var _AXObjectElements$_i = _slicedToArray$2(_AXObjectElements[_i], 2), key = _AXObjectElements$_i[0], values10 = _AXObjectElements$_i[1];
      fn.call(thisArg, values10, key, AXObjectElements$1);
    }
  },
  get: function get7(key) {
    var item = AXObjectElements$1.find(function(tuple) {
      return tuple[0] === key ? true : false;
    });
    return item && item[1];
  },
  has: function has7(key) {
    return !!AXObjectElementMap.get(key);
  },
  keys: function keys8() {
    return AXObjectElements$1.map(function(_ref) {
      var _ref2 = _slicedToArray$2(_ref, 1), key = _ref2[0];
      return key;
    });
  },
  values: function values7() {
    return AXObjectElements$1.map(function(_ref3) {
      var _ref4 = _slicedToArray$2(_ref3, 2), values10 = _ref4[1];
      return values10;
    });
  }
};
var _default$2 = (0, _iterationDecorator$2.default)(AXObjectElementMap, AXObjectElementMap.entries());
AXObjectElementMap$1.default = _default$2;
var AXObjectRoleMap$1 = {};
Object.defineProperty(AXObjectRoleMap$1, "__esModule", {
  value: true
});
AXObjectRoleMap$1.default = void 0;
var _iterationDecorator$1 = _interopRequireDefault$2(iterationDecorator$1);
var _AXObjectsMap$2 = _interopRequireDefault$2(AXObjectsMap$1);
function _interopRequireDefault$2(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}
function _slicedToArray$1(arr, i) {
  return _arrayWithHoles$1(arr) || _iterableToArrayLimit$1(arr, i) || _unsupportedIterableToArray$1(arr, i) || _nonIterableRest$1();
}
function _nonIterableRest$1() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _iterableToArrayLimit$1(arr, i) {
  var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
  if (_i == null) return;
  var _arr = [];
  var _n = true;
  var _d = false;
  var _s, _e;
  try {
    for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);
      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }
  return _arr;
}
function _arrayWithHoles$1(arr) {
  if (Array.isArray(arr)) return arr;
}
function _createForOfIteratorHelper$1(o2, allowArrayLike) {
  var it = typeof Symbol !== "undefined" && o2[Symbol.iterator] || o2["@@iterator"];
  if (!it) {
    if (Array.isArray(o2) || (it = _unsupportedIterableToArray$1(o2)) || allowArrayLike) {
      if (it) o2 = it;
      var i = 0;
      var F = function F2() {
      };
      return { s: F, n: function n2() {
        if (i >= o2.length) return { done: true };
        return { done: false, value: o2[i++] };
      }, e: function e2(_e2) {
        throw _e2;
      }, f: F };
    }
    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  var normalCompletion = true, didErr = false, err;
  return { s: function s() {
    it = it.call(o2);
  }, n: function n2() {
    var step = it.next();
    normalCompletion = step.done;
    return step;
  }, e: function e2(_e3) {
    didErr = true;
    err = _e3;
  }, f: function f2() {
    try {
      if (!normalCompletion && it.return != null) it.return();
    } finally {
      if (didErr) throw err;
    }
  } };
}
function _unsupportedIterableToArray$1(o2, minLen) {
  if (!o2) return;
  if (typeof o2 === "string") return _arrayLikeToArray$1(o2, minLen);
  var n2 = Object.prototype.toString.call(o2).slice(8, -1);
  if (n2 === "Object" && o2.constructor) n2 = o2.constructor.name;
  if (n2 === "Map" || n2 === "Set") return Array.from(o2);
  if (n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2)) return _arrayLikeToArray$1(o2, minLen);
}
function _arrayLikeToArray$1(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) {
    arr2[i] = arr[i];
  }
  return arr2;
}
var AXObjectRoleElements = [];
var _iterator$1 = _createForOfIteratorHelper$1(_AXObjectsMap$2.default.entries()), _step$1;
try {
  var _loop$1 = function _loop() {
    var _step$value = _slicedToArray$1(_step$1.value, 2), name = _step$value[0], def = _step$value[1];
    var relatedConcepts = def.relatedConcepts;
    if (Array.isArray(relatedConcepts)) {
      relatedConcepts.forEach(function(relation) {
        if (relation.module === "ARIA") {
          var concept = relation.concept;
          if (concept) {
            var index2 = AXObjectRoleElements.findIndex(function(_ref5) {
              var _ref6 = _slicedToArray$1(_ref5, 1), key = _ref6[0];
              return key === name;
            });
            if (index2 === -1) {
              AXObjectRoleElements.push([name, []]);
              index2 = AXObjectRoleElements.length - 1;
            }
            AXObjectRoleElements[index2][1].push(concept);
          }
        }
      });
    }
  };
  for (_iterator$1.s(); !(_step$1 = _iterator$1.n()).done; ) {
    _loop$1();
  }
} catch (err) {
  _iterator$1.e(err);
} finally {
  _iterator$1.f();
}
var AXObjectRoleMap = {
  entries: function entries8() {
    return AXObjectRoleElements;
  },
  forEach: function forEach8(fn) {
    var thisArg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
    for (var _i = 0, _AXObjectRoleElements = AXObjectRoleElements; _i < _AXObjectRoleElements.length; _i++) {
      var _AXObjectRoleElements2 = _slicedToArray$1(_AXObjectRoleElements[_i], 2), key = _AXObjectRoleElements2[0], values10 = _AXObjectRoleElements2[1];
      fn.call(thisArg, values10, key, AXObjectRoleElements);
    }
  },
  get: function get8(key) {
    var item = AXObjectRoleElements.find(function(tuple) {
      return tuple[0] === key ? true : false;
    });
    return item && item[1];
  },
  has: function has8(key) {
    return !!AXObjectRoleMap.get(key);
  },
  keys: function keys9() {
    return AXObjectRoleElements.map(function(_ref) {
      var _ref2 = _slicedToArray$1(_ref, 1), key = _ref2[0];
      return key;
    });
  },
  values: function values8() {
    return AXObjectRoleElements.map(function(_ref3) {
      var _ref4 = _slicedToArray$1(_ref3, 2), values10 = _ref4[1];
      return values10;
    });
  }
};
var _default$1 = (0, _iterationDecorator$1.default)(AXObjectRoleMap, AXObjectRoleMap.entries());
AXObjectRoleMap$1.default = _default$1;
var elementAXObjectMap$1 = {};
Object.defineProperty(elementAXObjectMap$1, "__esModule", {
  value: true
});
elementAXObjectMap$1.default = void 0;
var _AXObjectsMap$1 = _interopRequireDefault$1(AXObjectsMap$1);
var _iterationDecorator = _interopRequireDefault$1(iterationDecorator$1);
function _interopRequireDefault$1(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}
function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
}
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _iterableToArrayLimit(arr, i) {
  var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
  if (_i == null) return;
  var _arr = [];
  var _n = true;
  var _d = false;
  var _s, _e;
  try {
    for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);
      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }
  return _arr;
}
function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}
function _createForOfIteratorHelper(o2, allowArrayLike) {
  var it = typeof Symbol !== "undefined" && o2[Symbol.iterator] || o2["@@iterator"];
  if (!it) {
    if (Array.isArray(o2) || (it = _unsupportedIterableToArray(o2)) || allowArrayLike) {
      if (it) o2 = it;
      var i = 0;
      var F = function F2() {
      };
      return { s: F, n: function n2() {
        if (i >= o2.length) return { done: true };
        return { done: false, value: o2[i++] };
      }, e: function e2(_e2) {
        throw _e2;
      }, f: F };
    }
    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  var normalCompletion = true, didErr = false, err;
  return { s: function s() {
    it = it.call(o2);
  }, n: function n2() {
    var step = it.next();
    normalCompletion = step.done;
    return step;
  }, e: function e2(_e3) {
    didErr = true;
    err = _e3;
  }, f: function f2() {
    try {
      if (!normalCompletion && it.return != null) it.return();
    } finally {
      if (didErr) throw err;
    }
  } };
}
function _unsupportedIterableToArray(o2, minLen) {
  if (!o2) return;
  if (typeof o2 === "string") return _arrayLikeToArray(o2, minLen);
  var n2 = Object.prototype.toString.call(o2).slice(8, -1);
  if (n2 === "Object" && o2.constructor) n2 = o2.constructor.name;
  if (n2 === "Map" || n2 === "Set") return Array.from(o2);
  if (n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2)) return _arrayLikeToArray(o2, minLen);
}
function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) {
    arr2[i] = arr[i];
  }
  return arr2;
}
var elementAXObjects$1 = [];
var _iterator = _createForOfIteratorHelper(_AXObjectsMap$1.default.entries()), _step;
try {
  var _loop = function _loop2() {
    var _step$value = _slicedToArray(_step.value, 2), name = _step$value[0], def = _step$value[1];
    var relatedConcepts = def.relatedConcepts;
    if (Array.isArray(relatedConcepts)) {
      relatedConcepts.forEach(function(relation) {
        if (relation.module === "HTML") {
          var concept = relation.concept;
          if (concept != null) {
            var conceptStr = JSON.stringify(concept);
            var axObjects;
            var index2 = 0;
            for (; index2 < elementAXObjects$1.length; index2++) {
              var key = elementAXObjects$1[index2][0];
              if (JSON.stringify(key) === conceptStr) {
                axObjects = elementAXObjects$1[index2][1];
                break;
              }
            }
            if (!Array.isArray(axObjects)) {
              axObjects = [];
            }
            var loc = axObjects.findIndex(function(item) {
              return item === name;
            });
            if (loc === -1) {
              axObjects.push(name);
            }
            if (index2 < elementAXObjects$1.length) {
              elementAXObjects$1.splice(index2, 1, [concept, axObjects]);
            } else {
              elementAXObjects$1.push([concept, axObjects]);
            }
          }
        }
      });
    }
  };
  for (_iterator.s(); !(_step = _iterator.n()).done; ) {
    _loop();
  }
} catch (err) {
  _iterator.e(err);
} finally {
  _iterator.f();
}
function deepAxObjectModelRelationshipConceptAttributeCheck(a2, b2) {
  if (a2 === void 0 && b2 !== void 0) {
    return false;
  }
  if (a2 !== void 0 && b2 === void 0) {
    return false;
  }
  if (a2 !== void 0 && b2 !== void 0) {
    if (a2.length != b2.length) {
      return false;
    }
    for (var i = 0; i < a2.length; i++) {
      if (b2[i].name !== a2[i].name || b2[i].value !== a2[i].value) {
        return false;
      }
    }
  }
  return true;
}
var elementAXObjectMap = {
  entries: function entries9() {
    return elementAXObjects$1;
  },
  forEach: function forEach9(fn) {
    var thisArg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
    for (var _i = 0, _elementAXObjects = elementAXObjects$1; _i < _elementAXObjects.length; _i++) {
      var _elementAXObjects$_i = _slicedToArray(_elementAXObjects[_i], 2), key = _elementAXObjects$_i[0], values10 = _elementAXObjects$_i[1];
      fn.call(thisArg, values10, key, elementAXObjects$1);
    }
  },
  get: function get9(key) {
    var item = elementAXObjects$1.find(function(tuple) {
      return key.name === tuple[0].name && deepAxObjectModelRelationshipConceptAttributeCheck(key.attributes, tuple[0].attributes);
    });
    return item && item[1];
  },
  has: function has9(key) {
    return !!elementAXObjectMap.get(key);
  },
  keys: function keys10() {
    return elementAXObjects$1.map(function(_ref) {
      var _ref2 = _slicedToArray(_ref, 1), key = _ref2[0];
      return key;
    });
  },
  values: function values9() {
    return elementAXObjects$1.map(function(_ref3) {
      var _ref4 = _slicedToArray(_ref3, 2), values10 = _ref4[1];
      return values10;
    });
  }
};
var _default = (0, _iterationDecorator.default)(elementAXObjectMap, elementAXObjectMap.entries());
elementAXObjectMap$1.default = _default;
Object.defineProperty(lib, "__esModule", {
  value: true
});
var elementAXObjects_1 = lib.elementAXObjects = AXObjects_1 = lib.AXObjects = lib.AXObjectRoles = lib.AXObjectElements = void 0;
var _AXObjectElementMap = _interopRequireDefault(AXObjectElementMap$1);
var _AXObjectRoleMap = _interopRequireDefault(AXObjectRoleMap$1);
var _AXObjectsMap = _interopRequireDefault(AXObjectsMap$1);
var _elementAXObjectMap = _interopRequireDefault(elementAXObjectMap$1);
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}
var AXObjectElements = _AXObjectElementMap.default;
lib.AXObjectElements = AXObjectElements;
var AXObjectRoles = _AXObjectRoleMap.default;
lib.AXObjectRoles = AXObjectRoles;
var AXObjects = _AXObjectsMap.default;
var AXObjects_1 = lib.AXObjects = AXObjects;
var elementAXObjects = _elementAXObjectMap.default;
elementAXObjects_1 = lib.elementAXObjects = elementAXObjects;
const aria_roles = roles_1.keys();
const abstract_roles = aria_roles.filter((role) => {
  var _a2;
  return (_a2 = roles_1.get(role)) == null ? void 0 : _a2.abstract;
});
const non_abstract_roles = aria_roles.filter((name) => !abstract_roles.includes(name));
const non_interactive_roles = non_abstract_roles.filter((name) => {
  const role = roles_1.get(name);
  return (
    // 'toolbar' does not descend from widget, but it does support
    // aria-activedescendant, thus in practice we treat it as a widget.
    // focusable tabpanel elements are recommended if any panels in a set contain content where the first element in the panel is not focusable.
    // 'generic' is meant to have no semantic meaning.
    // 'cell' is treated as CellRole by the AXObject which is interactive, so we treat 'cell' it as interactive as well.
    !["toolbar", "tabpanel", "generic", "cell"].includes(name) && !(role == null ? void 0 : role.superClass.some((classes) => classes.includes("widget")))
  );
}).concat(
  // The `progressbar` is descended from `widget`, but in practice, its
  // value is always `readonly`, so we treat it as a non-interactive role.
  "progressbar"
);
const interactive_roles = non_abstract_roles.filter(
  (name) => !non_interactive_roles.includes(name) && // 'generic' is meant to have no semantic meaning.
  name !== "generic"
);
elementRoles_1.entries().forEach(([schema, roles2]) => {
  if ([...roles2].every((role) => role !== "generic" && non_interactive_roles.includes(role))) ;
});
elementRoles_1.entries().forEach(([schema, roles2]) => {
  if ([...roles2].every((role) => interactive_roles.includes(role))) ;
});
const interactive_ax_objects = [...AXObjects_1.keys()].filter(
  (name) => AXObjects_1.get(name).type === "widget"
);
const non_interactive_ax_objects = [...AXObjects_1.keys()].filter(
  (name) => ["windows", "structure"].includes(AXObjects_1.get(name).type)
);
elementAXObjects_1.entries().forEach(
  /**
   * @param {any} _
   */
  ([schema, ax_object]) => {
    if ([...ax_object].every((role) => interactive_ax_objects.includes(role))) ;
  }
);
elementAXObjects_1.entries().forEach(
  /**
   * @param {any} _
   */
  ([schema, ax_object]) => {
    if ([...ax_object].every((role) => non_interactive_ax_objects.includes(role))) ;
  }
);
var sourcemapCodec_umd = { exports: {} };
(function(module2, exports2) {
  (function(global2, factory) {
    factory(exports2);
  })(commonjsGlobal, function(exports3) {
    const comma = ",".charCodeAt(0);
    const semicolon = ";".charCodeAt(0);
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    const intToChar = new Uint8Array(64);
    const charToInt = new Uint8Array(128);
    for (let i = 0; i < chars.length; i++) {
      const c2 = chars.charCodeAt(i);
      intToChar[i] = c2;
      charToInt[c2] = i;
    }
    function decodeInteger(reader, relative) {
      let value = 0;
      let shift = 0;
      let integer = 0;
      do {
        const c2 = reader.next();
        integer = charToInt[c2];
        value |= (integer & 31) << shift;
        shift += 5;
      } while (integer & 32);
      const shouldNegate = value & 1;
      value >>>= 1;
      if (shouldNegate) {
        value = -2147483648 | -value;
      }
      return relative + value;
    }
    function encodeInteger(builder, num, relative) {
      let delta = num - relative;
      delta = delta < 0 ? -delta << 1 | 1 : delta << 1;
      do {
        let clamped = delta & 31;
        delta >>>= 5;
        if (delta > 0)
          clamped |= 32;
        builder.write(intToChar[clamped]);
      } while (delta > 0);
      return num;
    }
    function hasMoreVlq(reader, max) {
      if (reader.pos >= max)
        return false;
      return reader.peek() !== comma;
    }
    const bufLength = 1024 * 16;
    const td = typeof TextDecoder !== "undefined" ? /* @__PURE__ */ new TextDecoder() : typeof Buffer !== "undefined" ? {
      decode(buf) {
        const out = Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength);
        return out.toString();
      }
    } : {
      decode(buf) {
        let out = "";
        for (let i = 0; i < buf.length; i++) {
          out += String.fromCharCode(buf[i]);
        }
        return out;
      }
    };
    class StringWriter {
      constructor() {
        this.pos = 0;
        this.out = "";
        this.buffer = new Uint8Array(bufLength);
      }
      write(v2) {
        const { buffer } = this;
        buffer[this.pos++] = v2;
        if (this.pos === bufLength) {
          this.out += td.decode(buffer);
          this.pos = 0;
        }
      }
      flush() {
        const { buffer, out, pos } = this;
        return pos > 0 ? out + td.decode(buffer.subarray(0, pos)) : out;
      }
    }
    class StringReader {
      constructor(buffer) {
        this.pos = 0;
        this.buffer = buffer;
      }
      next() {
        return this.buffer.charCodeAt(this.pos++);
      }
      peek() {
        return this.buffer.charCodeAt(this.pos);
      }
      indexOf(char) {
        const { buffer, pos } = this;
        const idx = buffer.indexOf(char, pos);
        return idx === -1 ? buffer.length : idx;
      }
    }
    const EMPTY = [];
    function decodeOriginalScopes(input) {
      const { length } = input;
      const reader = new StringReader(input);
      const scopes = [];
      const stack = [];
      let line = 0;
      for (; reader.pos < length; reader.pos++) {
        line = decodeInteger(reader, line);
        const column = decodeInteger(reader, 0);
        if (!hasMoreVlq(reader, length)) {
          const last = stack.pop();
          last[2] = line;
          last[3] = column;
          continue;
        }
        const kind = decodeInteger(reader, 0);
        const fields = decodeInteger(reader, 0);
        const hasName = fields & 1;
        const scope = hasName ? [line, column, 0, 0, kind, decodeInteger(reader, 0)] : [line, column, 0, 0, kind];
        let vars = EMPTY;
        if (hasMoreVlq(reader, length)) {
          vars = [];
          do {
            const varsIndex = decodeInteger(reader, 0);
            vars.push(varsIndex);
          } while (hasMoreVlq(reader, length));
        }
        scope.vars = vars;
        scopes.push(scope);
        stack.push(scope);
      }
      return scopes;
    }
    function encodeOriginalScopes(scopes) {
      const writer = new StringWriter();
      for (let i = 0; i < scopes.length; ) {
        i = _encodeOriginalScopes(scopes, i, writer, [0]);
      }
      return writer.flush();
    }
    function _encodeOriginalScopes(scopes, index2, writer, state2) {
      const scope = scopes[index2];
      const { 0: startLine, 1: startColumn, 2: endLine, 3: endColumn, 4: kind, vars } = scope;
      if (index2 > 0)
        writer.write(comma);
      state2[0] = encodeInteger(writer, startLine, state2[0]);
      encodeInteger(writer, startColumn, 0);
      encodeInteger(writer, kind, 0);
      const fields = scope.length === 6 ? 1 : 0;
      encodeInteger(writer, fields, 0);
      if (scope.length === 6)
        encodeInteger(writer, scope[5], 0);
      for (const v2 of vars) {
        encodeInteger(writer, v2, 0);
      }
      for (index2++; index2 < scopes.length; ) {
        const next = scopes[index2];
        const { 0: l2, 1: c2 } = next;
        if (l2 > endLine || l2 === endLine && c2 >= endColumn) {
          break;
        }
        index2 = _encodeOriginalScopes(scopes, index2, writer, state2);
      }
      writer.write(comma);
      state2[0] = encodeInteger(writer, endLine, state2[0]);
      encodeInteger(writer, endColumn, 0);
      return index2;
    }
    function decodeGeneratedRanges(input) {
      const { length } = input;
      const reader = new StringReader(input);
      const ranges = [];
      const stack = [];
      let genLine = 0;
      let definitionSourcesIndex = 0;
      let definitionScopeIndex = 0;
      let callsiteSourcesIndex = 0;
      let callsiteLine = 0;
      let callsiteColumn = 0;
      let bindingLine = 0;
      let bindingColumn = 0;
      do {
        const semi = reader.indexOf(";");
        let genColumn = 0;
        for (; reader.pos < semi; reader.pos++) {
          genColumn = decodeInteger(reader, genColumn);
          if (!hasMoreVlq(reader, semi)) {
            const last = stack.pop();
            last[2] = genLine;
            last[3] = genColumn;
            continue;
          }
          const fields = decodeInteger(reader, 0);
          const hasDefinition = fields & 1;
          const hasCallsite = fields & 2;
          const hasScope = fields & 4;
          let callsite = null;
          let bindings = EMPTY;
          let range;
          if (hasDefinition) {
            const defSourcesIndex = decodeInteger(reader, definitionSourcesIndex);
            definitionScopeIndex = decodeInteger(reader, definitionSourcesIndex === defSourcesIndex ? definitionScopeIndex : 0);
            definitionSourcesIndex = defSourcesIndex;
            range = [genLine, genColumn, 0, 0, defSourcesIndex, definitionScopeIndex];
          } else {
            range = [genLine, genColumn, 0, 0];
          }
          range.isScope = !!hasScope;
          if (hasCallsite) {
            const prevCsi = callsiteSourcesIndex;
            const prevLine = callsiteLine;
            callsiteSourcesIndex = decodeInteger(reader, callsiteSourcesIndex);
            const sameSource = prevCsi === callsiteSourcesIndex;
            callsiteLine = decodeInteger(reader, sameSource ? callsiteLine : 0);
            callsiteColumn = decodeInteger(reader, sameSource && prevLine === callsiteLine ? callsiteColumn : 0);
            callsite = [callsiteSourcesIndex, callsiteLine, callsiteColumn];
          }
          range.callsite = callsite;
          if (hasMoreVlq(reader, semi)) {
            bindings = [];
            do {
              bindingLine = genLine;
              bindingColumn = genColumn;
              const expressionsCount = decodeInteger(reader, 0);
              let expressionRanges;
              if (expressionsCount < -1) {
                expressionRanges = [[decodeInteger(reader, 0)]];
                for (let i = -1; i > expressionsCount; i--) {
                  const prevBl = bindingLine;
                  bindingLine = decodeInteger(reader, bindingLine);
                  bindingColumn = decodeInteger(reader, bindingLine === prevBl ? bindingColumn : 0);
                  const expression = decodeInteger(reader, 0);
                  expressionRanges.push([expression, bindingLine, bindingColumn]);
                }
              } else {
                expressionRanges = [[expressionsCount]];
              }
              bindings.push(expressionRanges);
            } while (hasMoreVlq(reader, semi));
          }
          range.bindings = bindings;
          ranges.push(range);
          stack.push(range);
        }
        genLine++;
        reader.pos = semi + 1;
      } while (reader.pos < length);
      return ranges;
    }
    function encodeGeneratedRanges(ranges) {
      if (ranges.length === 0)
        return "";
      const writer = new StringWriter();
      for (let i = 0; i < ranges.length; ) {
        i = _encodeGeneratedRanges(ranges, i, writer, [0, 0, 0, 0, 0, 0, 0]);
      }
      return writer.flush();
    }
    function _encodeGeneratedRanges(ranges, index2, writer, state2) {
      const range = ranges[index2];
      const { 0: startLine, 1: startColumn, 2: endLine, 3: endColumn, isScope, callsite, bindings } = range;
      if (state2[0] < startLine) {
        catchupLine(writer, state2[0], startLine);
        state2[0] = startLine;
        state2[1] = 0;
      } else if (index2 > 0) {
        writer.write(comma);
      }
      state2[1] = encodeInteger(writer, range[1], state2[1]);
      const fields = (range.length === 6 ? 1 : 0) | (callsite ? 2 : 0) | (isScope ? 4 : 0);
      encodeInteger(writer, fields, 0);
      if (range.length === 6) {
        const { 4: sourcesIndex, 5: scopesIndex } = range;
        if (sourcesIndex !== state2[2]) {
          state2[3] = 0;
        }
        state2[2] = encodeInteger(writer, sourcesIndex, state2[2]);
        state2[3] = encodeInteger(writer, scopesIndex, state2[3]);
      }
      if (callsite) {
        const { 0: sourcesIndex, 1: callLine, 2: callColumn } = range.callsite;
        if (sourcesIndex !== state2[4]) {
          state2[5] = 0;
          state2[6] = 0;
        } else if (callLine !== state2[5]) {
          state2[6] = 0;
        }
        state2[4] = encodeInteger(writer, sourcesIndex, state2[4]);
        state2[5] = encodeInteger(writer, callLine, state2[5]);
        state2[6] = encodeInteger(writer, callColumn, state2[6]);
      }
      if (bindings) {
        for (const binding of bindings) {
          if (binding.length > 1)
            encodeInteger(writer, -binding.length, 0);
          const expression = binding[0][0];
          encodeInteger(writer, expression, 0);
          let bindingStartLine = startLine;
          let bindingStartColumn = startColumn;
          for (let i = 1; i < binding.length; i++) {
            const expRange = binding[i];
            bindingStartLine = encodeInteger(writer, expRange[1], bindingStartLine);
            bindingStartColumn = encodeInteger(writer, expRange[2], bindingStartColumn);
            encodeInteger(writer, expRange[0], 0);
          }
        }
      }
      for (index2++; index2 < ranges.length; ) {
        const next = ranges[index2];
        const { 0: l2, 1: c2 } = next;
        if (l2 > endLine || l2 === endLine && c2 >= endColumn) {
          break;
        }
        index2 = _encodeGeneratedRanges(ranges, index2, writer, state2);
      }
      if (state2[0] < endLine) {
        catchupLine(writer, state2[0], endLine);
        state2[0] = endLine;
        state2[1] = 0;
      } else {
        writer.write(comma);
      }
      state2[1] = encodeInteger(writer, endColumn, state2[1]);
      return index2;
    }
    function catchupLine(writer, lastLine, line) {
      do {
        writer.write(semicolon);
      } while (++lastLine < line);
    }
    function decode(mappings) {
      const { length } = mappings;
      const reader = new StringReader(mappings);
      const decoded = [];
      let genColumn = 0;
      let sourcesIndex = 0;
      let sourceLine = 0;
      let sourceColumn = 0;
      let namesIndex = 0;
      do {
        const semi = reader.indexOf(";");
        const line = [];
        let sorted = true;
        let lastCol = 0;
        genColumn = 0;
        while (reader.pos < semi) {
          let seg;
          genColumn = decodeInteger(reader, genColumn);
          if (genColumn < lastCol)
            sorted = false;
          lastCol = genColumn;
          if (hasMoreVlq(reader, semi)) {
            sourcesIndex = decodeInteger(reader, sourcesIndex);
            sourceLine = decodeInteger(reader, sourceLine);
            sourceColumn = decodeInteger(reader, sourceColumn);
            if (hasMoreVlq(reader, semi)) {
              namesIndex = decodeInteger(reader, namesIndex);
              seg = [genColumn, sourcesIndex, sourceLine, sourceColumn, namesIndex];
            } else {
              seg = [genColumn, sourcesIndex, sourceLine, sourceColumn];
            }
          } else {
            seg = [genColumn];
          }
          line.push(seg);
          reader.pos++;
        }
        if (!sorted)
          sort(line);
        decoded.push(line);
        reader.pos = semi + 1;
      } while (reader.pos <= length);
      return decoded;
    }
    function sort(line) {
      line.sort(sortComparator);
    }
    function sortComparator(a2, b2) {
      return a2[0] - b2[0];
    }
    function encode(decoded) {
      const writer = new StringWriter();
      let sourcesIndex = 0;
      let sourceLine = 0;
      let sourceColumn = 0;
      let namesIndex = 0;
      for (let i = 0; i < decoded.length; i++) {
        const line = decoded[i];
        if (i > 0)
          writer.write(semicolon);
        if (line.length === 0)
          continue;
        let genColumn = 0;
        for (let j = 0; j < line.length; j++) {
          const segment = line[j];
          if (j > 0)
            writer.write(comma);
          genColumn = encodeInteger(writer, segment[0], genColumn);
          if (segment.length === 1)
            continue;
          sourcesIndex = encodeInteger(writer, segment[1], sourcesIndex);
          sourceLine = encodeInteger(writer, segment[2], sourceLine);
          sourceColumn = encodeInteger(writer, segment[3], sourceColumn);
          if (segment.length === 4)
            continue;
          namesIndex = encodeInteger(writer, segment[4], namesIndex);
        }
      }
      return writer.flush();
    }
    exports3.decode = decode;
    exports3.decodeGeneratedRanges = decodeGeneratedRanges;
    exports3.decodeOriginalScopes = decodeOriginalScopes;
    exports3.encode = encode;
    exports3.encodeGeneratedRanges = encodeGeneratedRanges;
    exports3.encodeOriginalScopes = encodeOriginalScopes;
    Object.defineProperty(exports3, "__esModule", { value: true });
  });
})(sourcemapCodec_umd, sourcemapCodec_umd.exports);
var sourcemapCodec_umdExports = sourcemapCodec_umd.exports;
const PUBLIC_VERSION = "5";
var remapping_umd = { exports: {} };
var traceMapping_umd = { exports: {} };
var resolveUri_umd = { exports: {} };
var hasRequiredResolveUri_umd;
function requireResolveUri_umd() {
  if (hasRequiredResolveUri_umd) return resolveUri_umd.exports;
  hasRequiredResolveUri_umd = 1;
  (function(module2, exports2) {
    (function(global2, factory) {
      module2.exports = factory();
    })(commonjsGlobal, function() {
      const schemeRegex = /^[\w+.-]+:\/\//;
      const urlRegex = /^([\w+.-]+:)\/\/([^@/#?]*@)?([^:/#?]*)(:\d+)?(\/[^#?]*)?(\?[^#]*)?(#.*)?/;
      const fileRegex = /^file:(?:\/\/((?![a-z]:)[^/#?]*)?)?(\/?[^#?]*)(\?[^#]*)?(#.*)?/i;
      function isAbsoluteUrl(input) {
        return schemeRegex.test(input);
      }
      function isSchemeRelativeUrl(input) {
        return input.startsWith("//");
      }
      function isAbsolutePath(input) {
        return input.startsWith("/");
      }
      function isFileUrl(input) {
        return input.startsWith("file:");
      }
      function isRelative(input) {
        return /^[.?#]/.test(input);
      }
      function parseAbsoluteUrl(input) {
        const match = urlRegex.exec(input);
        return makeUrl(match[1], match[2] || "", match[3], match[4] || "", match[5] || "/", match[6] || "", match[7] || "");
      }
      function parseFileUrl(input) {
        const match = fileRegex.exec(input);
        const path = match[2];
        return makeUrl("file:", "", match[1] || "", "", isAbsolutePath(path) ? path : "/" + path, match[3] || "", match[4] || "");
      }
      function makeUrl(scheme, user, host, port, path, query, hash) {
        return {
          scheme,
          user,
          host,
          port,
          path,
          query,
          hash,
          type: 7
        };
      }
      function parseUrl(input) {
        if (isSchemeRelativeUrl(input)) {
          const url2 = parseAbsoluteUrl("http:" + input);
          url2.scheme = "";
          url2.type = 6;
          return url2;
        }
        if (isAbsolutePath(input)) {
          const url2 = parseAbsoluteUrl("http://foo.com" + input);
          url2.scheme = "";
          url2.host = "";
          url2.type = 5;
          return url2;
        }
        if (isFileUrl(input))
          return parseFileUrl(input);
        if (isAbsoluteUrl(input))
          return parseAbsoluteUrl(input);
        const url = parseAbsoluteUrl("http://foo.com/" + input);
        url.scheme = "";
        url.host = "";
        url.type = input ? input.startsWith("?") ? 3 : input.startsWith("#") ? 2 : 4 : 1;
        return url;
      }
      function stripPathFilename(path) {
        if (path.endsWith("/.."))
          return path;
        const index2 = path.lastIndexOf("/");
        return path.slice(0, index2 + 1);
      }
      function mergePaths(url, base) {
        normalizePath(base, base.type);
        if (url.path === "/") {
          url.path = base.path;
        } else {
          url.path = stripPathFilename(base.path) + url.path;
        }
      }
      function normalizePath(url, type) {
        const rel = type <= 4;
        const pieces = url.path.split("/");
        let pointer = 1;
        let positive = 0;
        let addTrailingSlash = false;
        for (let i = 1; i < pieces.length; i++) {
          const piece = pieces[i];
          if (!piece) {
            addTrailingSlash = true;
            continue;
          }
          addTrailingSlash = false;
          if (piece === ".")
            continue;
          if (piece === "..") {
            if (positive) {
              addTrailingSlash = true;
              positive--;
              pointer--;
            } else if (rel) {
              pieces[pointer++] = piece;
            }
            continue;
          }
          pieces[pointer++] = piece;
          positive++;
        }
        let path = "";
        for (let i = 1; i < pointer; i++) {
          path += "/" + pieces[i];
        }
        if (!path || addTrailingSlash && !path.endsWith("/..")) {
          path += "/";
        }
        url.path = path;
      }
      function resolve(input, base) {
        if (!input && !base)
          return "";
        const url = parseUrl(input);
        let inputType = url.type;
        if (base && inputType !== 7) {
          const baseUrl = parseUrl(base);
          const baseType = baseUrl.type;
          switch (inputType) {
            case 1:
              url.hash = baseUrl.hash;
            case 2:
              url.query = baseUrl.query;
            case 3:
            case 4:
              mergePaths(url, baseUrl);
            case 5:
              url.user = baseUrl.user;
              url.host = baseUrl.host;
              url.port = baseUrl.port;
            case 6:
              url.scheme = baseUrl.scheme;
          }
          if (baseType > inputType)
            inputType = baseType;
        }
        normalizePath(url, inputType);
        const queryHash = url.query + url.hash;
        switch (inputType) {
          case 2:
          case 3:
            return queryHash;
          case 4: {
            const path = url.path.slice(1);
            if (!path)
              return queryHash || ".";
            if (isRelative(base || input) && !isRelative(path)) {
              return "./" + path + queryHash;
            }
            return path + queryHash;
          }
          case 5:
            return url.path + queryHash;
          default:
            return url.scheme + "//" + url.user + url.host + url.port + url.path + queryHash;
        }
      }
      return resolve;
    });
  })(resolveUri_umd);
  return resolveUri_umd.exports;
}
var hasRequiredTraceMapping_umd;
function requireTraceMapping_umd() {
  if (hasRequiredTraceMapping_umd) return traceMapping_umd.exports;
  hasRequiredTraceMapping_umd = 1;
  (function(module2, exports2) {
    (function(global2, factory) {
      factory(exports2, sourcemapCodec_umdExports, requireResolveUri_umd());
    })(commonjsGlobal, function(exports3, sourcemapCodec, resolveUri) {
      function resolve(input, base) {
        if (base && !base.endsWith("/"))
          base += "/";
        return resolveUri(input, base);
      }
      function stripFilename(path) {
        if (!path)
          return "";
        const index2 = path.lastIndexOf("/");
        return path.slice(0, index2 + 1);
      }
      const COLUMN = 0;
      const SOURCES_INDEX = 1;
      const SOURCE_LINE = 2;
      const SOURCE_COLUMN = 3;
      const NAMES_INDEX = 4;
      const REV_GENERATED_LINE = 1;
      const REV_GENERATED_COLUMN = 2;
      function maybeSort(mappings, owned) {
        const unsortedIndex = nextUnsortedSegmentLine(mappings, 0);
        if (unsortedIndex === mappings.length)
          return mappings;
        if (!owned)
          mappings = mappings.slice();
        for (let i = unsortedIndex; i < mappings.length; i = nextUnsortedSegmentLine(mappings, i + 1)) {
          mappings[i] = sortSegments(mappings[i], owned);
        }
        return mappings;
      }
      function nextUnsortedSegmentLine(mappings, start) {
        for (let i = start; i < mappings.length; i++) {
          if (!isSorted(mappings[i]))
            return i;
        }
        return mappings.length;
      }
      function isSorted(line) {
        for (let j = 1; j < line.length; j++) {
          if (line[j][COLUMN] < line[j - 1][COLUMN]) {
            return false;
          }
        }
        return true;
      }
      function sortSegments(line, owned) {
        if (!owned)
          line = line.slice();
        return line.sort(sortComparator);
      }
      function sortComparator(a2, b2) {
        return a2[COLUMN] - b2[COLUMN];
      }
      let found = false;
      function binarySearch(haystack, needle, low, high) {
        while (low <= high) {
          const mid = low + (high - low >> 1);
          const cmp = haystack[mid][COLUMN] - needle;
          if (cmp === 0) {
            found = true;
            return mid;
          }
          if (cmp < 0) {
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        }
        found = false;
        return low - 1;
      }
      function upperBound(haystack, needle, index2) {
        for (let i = index2 + 1; i < haystack.length; index2 = i++) {
          if (haystack[i][COLUMN] !== needle)
            break;
        }
        return index2;
      }
      function lowerBound(haystack, needle, index2) {
        for (let i = index2 - 1; i >= 0; index2 = i--) {
          if (haystack[i][COLUMN] !== needle)
            break;
        }
        return index2;
      }
      function memoizedState() {
        return {
          lastKey: -1,
          lastNeedle: -1,
          lastIndex: -1
        };
      }
      function memoizedBinarySearch(haystack, needle, state2, key) {
        const { lastKey, lastNeedle, lastIndex } = state2;
        let low = 0;
        let high = haystack.length - 1;
        if (key === lastKey) {
          if (needle === lastNeedle) {
            found = lastIndex !== -1 && haystack[lastIndex][COLUMN] === needle;
            return lastIndex;
          }
          if (needle >= lastNeedle) {
            low = lastIndex === -1 ? 0 : lastIndex;
          } else {
            high = lastIndex;
          }
        }
        state2.lastKey = key;
        state2.lastNeedle = needle;
        return state2.lastIndex = binarySearch(haystack, needle, low, high);
      }
      function buildBySources(decoded, memos) {
        const sources = memos.map(buildNullArray);
        for (let i = 0; i < decoded.length; i++) {
          const line = decoded[i];
          for (let j = 0; j < line.length; j++) {
            const seg = line[j];
            if (seg.length === 1)
              continue;
            const sourceIndex2 = seg[SOURCES_INDEX];
            const sourceLine = seg[SOURCE_LINE];
            const sourceColumn = seg[SOURCE_COLUMN];
            const originalSource = sources[sourceIndex2];
            const originalLine = originalSource[sourceLine] || (originalSource[sourceLine] = []);
            const memo = memos[sourceIndex2];
            let index2 = upperBound(originalLine, sourceColumn, memoizedBinarySearch(originalLine, sourceColumn, memo, sourceLine));
            memo.lastIndex = ++index2;
            insert(originalLine, index2, [sourceColumn, i, seg[COLUMN]]);
          }
        }
        return sources;
      }
      function insert(array, index2, value) {
        for (let i = array.length; i > index2; i--) {
          array[i] = array[i - 1];
        }
        array[index2] = value;
      }
      function buildNullArray() {
        return { __proto__: null };
      }
      const AnyMap = function(map, mapUrl) {
        const parsed = parse4(map);
        if (!("sections" in parsed)) {
          return new TraceMap(parsed, mapUrl);
        }
        const mappings = [];
        const sources = [];
        const sourcesContent = [];
        const names = [];
        const ignoreList = [];
        recurse(parsed, mapUrl, mappings, sources, sourcesContent, names, ignoreList, 0, 0, Infinity, Infinity);
        const joined = {
          version: 3,
          file: parsed.file,
          names,
          sources,
          sourcesContent,
          mappings,
          ignoreList
        };
        return presortedDecodedMap(joined);
      };
      function parse4(map) {
        return typeof map === "string" ? JSON.parse(map) : map;
      }
      function recurse(input, mapUrl, mappings, sources, sourcesContent, names, ignoreList, lineOffset, columnOffset, stopLine, stopColumn) {
        const { sections } = input;
        for (let i = 0; i < sections.length; i++) {
          const { map, offset: offset2 } = sections[i];
          let sl = stopLine;
          let sc = stopColumn;
          if (i + 1 < sections.length) {
            const nextOffset = sections[i + 1].offset;
            sl = Math.min(stopLine, lineOffset + nextOffset.line);
            if (sl === stopLine) {
              sc = Math.min(stopColumn, columnOffset + nextOffset.column);
            } else if (sl < stopLine) {
              sc = columnOffset + nextOffset.column;
            }
          }
          addSection(map, mapUrl, mappings, sources, sourcesContent, names, ignoreList, lineOffset + offset2.line, columnOffset + offset2.column, sl, sc);
        }
      }
      function addSection(input, mapUrl, mappings, sources, sourcesContent, names, ignoreList, lineOffset, columnOffset, stopLine, stopColumn) {
        const parsed = parse4(input);
        if ("sections" in parsed)
          return recurse(...arguments);
        const map = new TraceMap(parsed, mapUrl);
        const sourcesOffset = sources.length;
        const namesOffset = names.length;
        const decoded = decodedMappings(map);
        const { resolvedSources, sourcesContent: contents, ignoreList: ignores } = map;
        append2(sources, resolvedSources);
        append2(names, map.names);
        if (contents)
          append2(sourcesContent, contents);
        else
          for (let i = 0; i < resolvedSources.length; i++)
            sourcesContent.push(null);
        if (ignores)
          for (let i = 0; i < ignores.length; i++)
            ignoreList.push(ignores[i] + sourcesOffset);
        for (let i = 0; i < decoded.length; i++) {
          const lineI = lineOffset + i;
          if (lineI > stopLine)
            return;
          const out = getLine(mappings, lineI);
          const cOffset = i === 0 ? columnOffset : 0;
          const line = decoded[i];
          for (let j = 0; j < line.length; j++) {
            const seg = line[j];
            const column = cOffset + seg[COLUMN];
            if (lineI === stopLine && column >= stopColumn)
              return;
            if (seg.length === 1) {
              out.push([column]);
              continue;
            }
            const sourcesIndex = sourcesOffset + seg[SOURCES_INDEX];
            const sourceLine = seg[SOURCE_LINE];
            const sourceColumn = seg[SOURCE_COLUMN];
            out.push(seg.length === 4 ? [column, sourcesIndex, sourceLine, sourceColumn] : [column, sourcesIndex, sourceLine, sourceColumn, namesOffset + seg[NAMES_INDEX]]);
          }
        }
      }
      function append2(arr, other) {
        for (let i = 0; i < other.length; i++)
          arr.push(other[i]);
      }
      function getLine(arr, index2) {
        for (let i = arr.length; i <= index2; i++)
          arr[i] = [];
        return arr[index2];
      }
      const LINE_GTR_ZERO = "`line` must be greater than 0 (lines start at line 1)";
      const COL_GTR_EQ_ZERO = "`column` must be greater than or equal to 0 (columns start at column 0)";
      const LEAST_UPPER_BOUND = -1;
      const GREATEST_LOWER_BOUND = 1;
      class TraceMap {
        constructor(map, mapUrl) {
          const isString = typeof map === "string";
          if (!isString && map._decodedMemo)
            return map;
          const parsed = isString ? JSON.parse(map) : map;
          const { version: version2, file, names, sourceRoot, sources, sourcesContent } = parsed;
          this.version = version2;
          this.file = file;
          this.names = names || [];
          this.sourceRoot = sourceRoot;
          this.sources = sources;
          this.sourcesContent = sourcesContent;
          this.ignoreList = parsed.ignoreList || parsed.x_google_ignoreList || void 0;
          const from = resolve(sourceRoot || "", stripFilename(mapUrl));
          this.resolvedSources = sources.map((s) => resolve(s || "", from));
          const { mappings } = parsed;
          if (typeof mappings === "string") {
            this._encoded = mappings;
            this._decoded = void 0;
          } else {
            this._encoded = void 0;
            this._decoded = maybeSort(mappings, isString);
          }
          this._decodedMemo = memoizedState();
          this._bySources = void 0;
          this._bySourceMemos = void 0;
        }
      }
      function cast(map) {
        return map;
      }
      function encodedMappings(map) {
        var _a2;
        var _b;
        return (_a2 = (_b = cast(map))._encoded) !== null && _a2 !== void 0 ? _a2 : _b._encoded = sourcemapCodec.encode(cast(map)._decoded);
      }
      function decodedMappings(map) {
        var _a2;
        return (_a2 = cast(map))._decoded || (_a2._decoded = sourcemapCodec.decode(cast(map)._encoded));
      }
      function traceSegment(map, line, column) {
        const decoded = decodedMappings(map);
        if (line >= decoded.length)
          return null;
        const segments = decoded[line];
        const index2 = traceSegmentInternal(segments, cast(map)._decodedMemo, line, column, GREATEST_LOWER_BOUND);
        return index2 === -1 ? null : segments[index2];
      }
      function originalPositionFor(map, needle) {
        let { line, column, bias } = needle;
        line--;
        if (line < 0)
          throw new Error(LINE_GTR_ZERO);
        if (column < 0)
          throw new Error(COL_GTR_EQ_ZERO);
        const decoded = decodedMappings(map);
        if (line >= decoded.length)
          return OMapping(null, null, null, null);
        const segments = decoded[line];
        const index2 = traceSegmentInternal(segments, cast(map)._decodedMemo, line, column, bias || GREATEST_LOWER_BOUND);
        if (index2 === -1)
          return OMapping(null, null, null, null);
        const segment = segments[index2];
        if (segment.length === 1)
          return OMapping(null, null, null, null);
        const { names, resolvedSources } = map;
        return OMapping(resolvedSources[segment[SOURCES_INDEX]], segment[SOURCE_LINE] + 1, segment[SOURCE_COLUMN], segment.length === 5 ? names[segment[NAMES_INDEX]] : null);
      }
      function generatedPositionFor(map, needle) {
        const { source: source2, line, column, bias } = needle;
        return generatedPosition(map, source2, line, column, bias || GREATEST_LOWER_BOUND, false);
      }
      function allGeneratedPositionsFor(map, needle) {
        const { source: source2, line, column, bias } = needle;
        return generatedPosition(map, source2, line, column, bias || LEAST_UPPER_BOUND, true);
      }
      function eachMapping(map, cb) {
        const decoded = decodedMappings(map);
        const { names, resolvedSources } = map;
        for (let i = 0; i < decoded.length; i++) {
          const line = decoded[i];
          for (let j = 0; j < line.length; j++) {
            const seg = line[j];
            const generatedLine = i + 1;
            const generatedColumn = seg[0];
            let source2 = null;
            let originalLine = null;
            let originalColumn = null;
            let name = null;
            if (seg.length !== 1) {
              source2 = resolvedSources[seg[1]];
              originalLine = seg[2] + 1;
              originalColumn = seg[3];
            }
            if (seg.length === 5)
              name = names[seg[4]];
            cb({
              generatedLine,
              generatedColumn,
              source: source2,
              originalLine,
              originalColumn,
              name
            });
          }
        }
      }
      function sourceIndex(map, source2) {
        const { sources, resolvedSources } = map;
        let index2 = sources.indexOf(source2);
        if (index2 === -1)
          index2 = resolvedSources.indexOf(source2);
        return index2;
      }
      function sourceContentFor(map, source2) {
        const { sourcesContent } = map;
        if (sourcesContent == null)
          return null;
        const index2 = sourceIndex(map, source2);
        return index2 === -1 ? null : sourcesContent[index2];
      }
      function isIgnored(map, source2) {
        const { ignoreList } = map;
        if (ignoreList == null)
          return false;
        const index2 = sourceIndex(map, source2);
        return index2 === -1 ? false : ignoreList.includes(index2);
      }
      function presortedDecodedMap(map, mapUrl) {
        const tracer = new TraceMap(clone(map, []), mapUrl);
        cast(tracer)._decoded = map.mappings;
        return tracer;
      }
      function decodedMap(map) {
        return clone(map, decodedMappings(map));
      }
      function encodedMap(map) {
        return clone(map, encodedMappings(map));
      }
      function clone(map, mappings) {
        return {
          version: map.version,
          file: map.file,
          names: map.names,
          sourceRoot: map.sourceRoot,
          sources: map.sources,
          sourcesContent: map.sourcesContent,
          mappings,
          ignoreList: map.ignoreList || map.x_google_ignoreList
        };
      }
      function OMapping(source2, line, column, name) {
        return { source: source2, line, column, name };
      }
      function GMapping(line, column) {
        return { line, column };
      }
      function traceSegmentInternal(segments, memo, line, column, bias) {
        let index2 = memoizedBinarySearch(segments, column, memo, line);
        if (found) {
          index2 = (bias === LEAST_UPPER_BOUND ? upperBound : lowerBound)(segments, column, index2);
        } else if (bias === LEAST_UPPER_BOUND)
          index2++;
        if (index2 === -1 || index2 === segments.length)
          return -1;
        return index2;
      }
      function sliceGeneratedPositions(segments, memo, line, column, bias) {
        let min = traceSegmentInternal(segments, memo, line, column, GREATEST_LOWER_BOUND);
        if (!found && bias === LEAST_UPPER_BOUND)
          min++;
        if (min === -1 || min === segments.length)
          return [];
        const matchedColumn = found ? column : segments[min][COLUMN];
        if (!found)
          min = lowerBound(segments, matchedColumn, min);
        const max = upperBound(segments, matchedColumn, min);
        const result = [];
        for (; min <= max; min++) {
          const segment = segments[min];
          result.push(GMapping(segment[REV_GENERATED_LINE] + 1, segment[REV_GENERATED_COLUMN]));
        }
        return result;
      }
      function generatedPosition(map, source2, line, column, bias, all) {
        var _a2;
        line--;
        if (line < 0)
          throw new Error(LINE_GTR_ZERO);
        if (column < 0)
          throw new Error(COL_GTR_EQ_ZERO);
        const { sources, resolvedSources } = map;
        let sourceIndex2 = sources.indexOf(source2);
        if (sourceIndex2 === -1)
          sourceIndex2 = resolvedSources.indexOf(source2);
        if (sourceIndex2 === -1)
          return all ? [] : GMapping(null, null);
        const generated = (_a2 = cast(map))._bySources || (_a2._bySources = buildBySources(decodedMappings(map), cast(map)._bySourceMemos = sources.map(memoizedState)));
        const segments = generated[sourceIndex2][line];
        if (segments == null)
          return all ? [] : GMapping(null, null);
        const memo = cast(map)._bySourceMemos[sourceIndex2];
        if (all)
          return sliceGeneratedPositions(segments, memo, line, column, bias);
        const index2 = traceSegmentInternal(segments, memo, line, column, bias);
        if (index2 === -1)
          return GMapping(null, null);
        const segment = segments[index2];
        return GMapping(segment[REV_GENERATED_LINE] + 1, segment[REV_GENERATED_COLUMN]);
      }
      exports3.AnyMap = AnyMap;
      exports3.GREATEST_LOWER_BOUND = GREATEST_LOWER_BOUND;
      exports3.LEAST_UPPER_BOUND = LEAST_UPPER_BOUND;
      exports3.TraceMap = TraceMap;
      exports3.allGeneratedPositionsFor = allGeneratedPositionsFor;
      exports3.decodedMap = decodedMap;
      exports3.decodedMappings = decodedMappings;
      exports3.eachMapping = eachMapping;
      exports3.encodedMap = encodedMap;
      exports3.encodedMappings = encodedMappings;
      exports3.generatedPositionFor = generatedPositionFor;
      exports3.isIgnored = isIgnored;
      exports3.originalPositionFor = originalPositionFor;
      exports3.presortedDecodedMap = presortedDecodedMap;
      exports3.sourceContentFor = sourceContentFor;
      exports3.traceSegment = traceSegment;
    });
  })(traceMapping_umd, traceMapping_umd.exports);
  return traceMapping_umd.exports;
}
var genMapping_umd = { exports: {} };
var setArray_umd = { exports: {} };
var hasRequiredSetArray_umd;
function requireSetArray_umd() {
  if (hasRequiredSetArray_umd) return setArray_umd.exports;
  hasRequiredSetArray_umd = 1;
  (function(module2, exports2) {
    (function(global2, factory) {
      factory(exports2);
    })(commonjsGlobal, function(exports3) {
      class SetArray {
        constructor() {
          this._indexes = { __proto__: null };
          this.array = [];
        }
      }
      function cast(set2) {
        return set2;
      }
      function get11(setarr, key) {
        return cast(setarr)._indexes[key];
      }
      function put(setarr, key) {
        const index2 = get11(setarr, key);
        if (index2 !== void 0)
          return index2;
        const { array, _indexes: indexes } = cast(setarr);
        const length = array.push(key);
        return indexes[key] = length - 1;
      }
      function pop2(setarr) {
        const { array, _indexes: indexes } = cast(setarr);
        if (array.length === 0)
          return;
        const last = array.pop();
        indexes[last] = void 0;
      }
      function remove(setarr, key) {
        const index2 = get11(setarr, key);
        if (index2 === void 0)
          return;
        const { array, _indexes: indexes } = cast(setarr);
        for (let i = index2 + 1; i < array.length; i++) {
          const k = array[i];
          array[i - 1] = k;
          indexes[k]--;
        }
        indexes[key] = void 0;
        array.pop();
      }
      exports3.SetArray = SetArray;
      exports3.get = get11;
      exports3.pop = pop2;
      exports3.put = put;
      exports3.remove = remove;
      Object.defineProperty(exports3, "__esModule", { value: true });
    });
  })(setArray_umd, setArray_umd.exports);
  return setArray_umd.exports;
}
var hasRequiredGenMapping_umd;
function requireGenMapping_umd() {
  if (hasRequiredGenMapping_umd) return genMapping_umd.exports;
  hasRequiredGenMapping_umd = 1;
  (function(module2, exports2) {
    (function(global2, factory) {
      factory(exports2, requireSetArray_umd(), sourcemapCodec_umdExports, requireTraceMapping_umd());
    })(commonjsGlobal, function(exports3, setArray, sourcemapCodec, traceMapping) {
      const COLUMN = 0;
      const SOURCES_INDEX = 1;
      const SOURCE_LINE = 2;
      const SOURCE_COLUMN = 3;
      const NAMES_INDEX = 4;
      const NO_NAME = -1;
      class GenMapping {
        constructor({ file, sourceRoot } = {}) {
          this._names = new setArray.SetArray();
          this._sources = new setArray.SetArray();
          this._sourcesContent = [];
          this._mappings = [];
          this.file = file;
          this.sourceRoot = sourceRoot;
          this._ignoreList = new setArray.SetArray();
        }
      }
      function cast(map) {
        return map;
      }
      function addSegment(map, genLine, genColumn, source2, sourceLine, sourceColumn, name, content) {
        return addSegmentInternal(false, map, genLine, genColumn, source2, sourceLine, sourceColumn, name, content);
      }
      function addMapping(map, mapping) {
        return addMappingInternal(false, map, mapping);
      }
      const maybeAddSegment = (map, genLine, genColumn, source2, sourceLine, sourceColumn, name, content) => {
        return addSegmentInternal(true, map, genLine, genColumn, source2, sourceLine, sourceColumn, name, content);
      };
      const maybeAddMapping = (map, mapping) => {
        return addMappingInternal(true, map, mapping);
      };
      function setSourceContent(map, source2, content) {
        const { _sources: sources, _sourcesContent: sourcesContent } = cast(map);
        const index2 = setArray.put(sources, source2);
        sourcesContent[index2] = content;
      }
      function setIgnore(map, source2, ignore = true) {
        const { _sources: sources, _sourcesContent: sourcesContent, _ignoreList: ignoreList } = cast(map);
        const index2 = setArray.put(sources, source2);
        if (index2 === sourcesContent.length)
          sourcesContent[index2] = null;
        if (ignore)
          setArray.put(ignoreList, index2);
        else
          setArray.remove(ignoreList, index2);
      }
      function toDecodedMap(map) {
        const { _mappings: mappings, _sources: sources, _sourcesContent: sourcesContent, _names: names, _ignoreList: ignoreList } = cast(map);
        removeEmptyFinalLines(mappings);
        return {
          version: 3,
          file: map.file || void 0,
          names: names.array,
          sourceRoot: map.sourceRoot || void 0,
          sources: sources.array,
          sourcesContent,
          mappings,
          ignoreList: ignoreList.array
        };
      }
      function toEncodedMap(map) {
        const decoded = toDecodedMap(map);
        return Object.assign(Object.assign({}, decoded), { mappings: sourcemapCodec.encode(decoded.mappings) });
      }
      function fromMap(input) {
        const map = new traceMapping.TraceMap(input);
        const gen = new GenMapping({ file: map.file, sourceRoot: map.sourceRoot });
        putAll(cast(gen)._names, map.names);
        putAll(cast(gen)._sources, map.sources);
        cast(gen)._sourcesContent = map.sourcesContent || map.sources.map(() => null);
        cast(gen)._mappings = traceMapping.decodedMappings(map);
        if (map.ignoreList)
          putAll(cast(gen)._ignoreList, map.ignoreList);
        return gen;
      }
      function allMappings(map) {
        const out = [];
        const { _mappings: mappings, _sources: sources, _names: names } = cast(map);
        for (let i = 0; i < mappings.length; i++) {
          const line = mappings[i];
          for (let j = 0; j < line.length; j++) {
            const seg = line[j];
            const generated = { line: i + 1, column: seg[COLUMN] };
            let source2 = void 0;
            let original = void 0;
            let name = void 0;
            if (seg.length !== 1) {
              source2 = sources.array[seg[SOURCES_INDEX]];
              original = { line: seg[SOURCE_LINE] + 1, column: seg[SOURCE_COLUMN] };
              if (seg.length === 5)
                name = names.array[seg[NAMES_INDEX]];
            }
            out.push({ generated, source: source2, original, name });
          }
        }
        return out;
      }
      function addSegmentInternal(skipable, map, genLine, genColumn, source2, sourceLine, sourceColumn, name, content) {
        const { _mappings: mappings, _sources: sources, _sourcesContent: sourcesContent, _names: names } = cast(map);
        const line = getLine(mappings, genLine);
        const index2 = getColumnIndex(line, genColumn);
        if (!source2) {
          if (skipable && skipSourceless(line, index2))
            return;
          return insert(line, index2, [genColumn]);
        }
        const sourcesIndex = setArray.put(sources, source2);
        const namesIndex = name ? setArray.put(names, name) : NO_NAME;
        if (sourcesIndex === sourcesContent.length)
          sourcesContent[sourcesIndex] = content !== null && content !== void 0 ? content : null;
        if (skipable && skipSource(line, index2, sourcesIndex, sourceLine, sourceColumn, namesIndex)) {
          return;
        }
        return insert(line, index2, name ? [genColumn, sourcesIndex, sourceLine, sourceColumn, namesIndex] : [genColumn, sourcesIndex, sourceLine, sourceColumn]);
      }
      function getLine(mappings, index2) {
        for (let i = mappings.length; i <= index2; i++) {
          mappings[i] = [];
        }
        return mappings[index2];
      }
      function getColumnIndex(line, genColumn) {
        let index2 = line.length;
        for (let i = index2 - 1; i >= 0; index2 = i--) {
          const current2 = line[i];
          if (genColumn >= current2[COLUMN])
            break;
        }
        return index2;
      }
      function insert(array, index2, value) {
        for (let i = array.length; i > index2; i--) {
          array[i] = array[i - 1];
        }
        array[index2] = value;
      }
      function removeEmptyFinalLines(mappings) {
        const { length } = mappings;
        let len = length;
        for (let i = len - 1; i >= 0; len = i, i--) {
          if (mappings[i].length > 0)
            break;
        }
        if (len < length)
          mappings.length = len;
      }
      function putAll(setarr, array) {
        for (let i = 0; i < array.length; i++)
          setArray.put(setarr, array[i]);
      }
      function skipSourceless(line, index2) {
        if (index2 === 0)
          return true;
        const prev = line[index2 - 1];
        return prev.length === 1;
      }
      function skipSource(line, index2, sourcesIndex, sourceLine, sourceColumn, namesIndex) {
        if (index2 === 0)
          return false;
        const prev = line[index2 - 1];
        if (prev.length === 1)
          return false;
        return sourcesIndex === prev[SOURCES_INDEX] && sourceLine === prev[SOURCE_LINE] && sourceColumn === prev[SOURCE_COLUMN] && namesIndex === (prev.length === 5 ? prev[NAMES_INDEX] : NO_NAME);
      }
      function addMappingInternal(skipable, map, mapping) {
        const { generated, source: source2, original, name, content } = mapping;
        if (!source2) {
          return addSegmentInternal(skipable, map, generated.line - 1, generated.column, null, null, null, null, null);
        }
        return addSegmentInternal(skipable, map, generated.line - 1, generated.column, source2, original.line - 1, original.column, name, content);
      }
      exports3.GenMapping = GenMapping;
      exports3.addMapping = addMapping;
      exports3.addSegment = addSegment;
      exports3.allMappings = allMappings;
      exports3.fromMap = fromMap;
      exports3.maybeAddMapping = maybeAddMapping;
      exports3.maybeAddSegment = maybeAddSegment;
      exports3.setIgnore = setIgnore;
      exports3.setSourceContent = setSourceContent;
      exports3.toDecodedMap = toDecodedMap;
      exports3.toEncodedMap = toEncodedMap;
      Object.defineProperty(exports3, "__esModule", { value: true });
    });
  })(genMapping_umd, genMapping_umd.exports);
  return genMapping_umd.exports;
}
(function(module2, exports2) {
  (function(global2, factory) {
    module2.exports = factory(requireTraceMapping_umd(), requireGenMapping_umd());
  })(commonjsGlobal, function(traceMapping, genMapping) {
    const SOURCELESS_MAPPING = /* @__PURE__ */ SegmentObject("", -1, -1, "", null, false);
    const EMPTY_SOURCES = [];
    function SegmentObject(source2, line, column, name, content, ignore) {
      return { source: source2, line, column, name, content, ignore };
    }
    function Source(map, sources, source2, content, ignore) {
      return {
        map,
        sources,
        source: source2,
        content,
        ignore
      };
    }
    function MapSource(map, sources) {
      return Source(map, sources, "", null, false);
    }
    function OriginalSource(source2, content, ignore) {
      return Source(null, EMPTY_SOURCES, source2, content, ignore);
    }
    function traceMappings(tree) {
      const gen = new genMapping.GenMapping({ file: tree.map.file });
      const { sources: rootSources, map } = tree;
      const rootNames = map.names;
      const rootMappings = traceMapping.decodedMappings(map);
      for (let i = 0; i < rootMappings.length; i++) {
        const segments = rootMappings[i];
        for (let j = 0; j < segments.length; j++) {
          const segment = segments[j];
          const genCol = segment[0];
          let traced = SOURCELESS_MAPPING;
          if (segment.length !== 1) {
            const source3 = rootSources[segment[1]];
            traced = originalPositionFor(source3, segment[2], segment[3], segment.length === 5 ? rootNames[segment[4]] : "");
            if (traced == null)
              continue;
          }
          const { column, line, name, content, source: source2, ignore } = traced;
          genMapping.maybeAddSegment(gen, i, genCol, source2, line, column, name);
          if (source2 && content != null)
            genMapping.setSourceContent(gen, source2, content);
          if (ignore)
            genMapping.setIgnore(gen, source2, true);
        }
      }
      return gen;
    }
    function originalPositionFor(source2, line, column, name) {
      if (!source2.map) {
        return SegmentObject(source2.source, line, column, name, source2.content, source2.ignore);
      }
      const segment = traceMapping.traceSegment(source2.map, line, column);
      if (segment == null)
        return null;
      if (segment.length === 1)
        return SOURCELESS_MAPPING;
      return originalPositionFor(source2.sources[segment[1]], segment[2], segment[3], segment.length === 5 ? source2.map.names[segment[4]] : name);
    }
    function asArray(value) {
      if (Array.isArray(value))
        return value;
      return [value];
    }
    function buildSourceMapTree(input, loader) {
      const maps = asArray(input).map((m2) => new traceMapping.TraceMap(m2, ""));
      const map = maps.pop();
      for (let i = 0; i < maps.length; i++) {
        if (maps[i].sources.length > 1) {
          throw new Error(`Transformation map ${i} must have exactly one source file.
Did you specify these with the most recent transformation maps first?`);
        }
      }
      let tree = build(map, loader, "", 0);
      for (let i = maps.length - 1; i >= 0; i--) {
        tree = MapSource(maps[i], [tree]);
      }
      return tree;
    }
    function build(map, loader, importer, importerDepth) {
      const { resolvedSources, sourcesContent, ignoreList } = map;
      const depth = importerDepth + 1;
      const children = resolvedSources.map((sourceFile, i) => {
        const ctx = {
          importer,
          depth,
          source: sourceFile || "",
          content: void 0,
          ignore: void 0
        };
        const sourceMap = loader(ctx.source, ctx);
        const { source: source2, content, ignore } = ctx;
        if (sourceMap)
          return build(new traceMapping.TraceMap(sourceMap, source2), loader, source2, depth);
        const sourceContent = content !== void 0 ? content : sourcesContent ? sourcesContent[i] : null;
        const ignored = ignore !== void 0 ? ignore : ignoreList ? ignoreList.includes(i) : false;
        return OriginalSource(source2, sourceContent, ignored);
      });
      return MapSource(map, children);
    }
    class SourceMap {
      constructor(map, options) {
        const out = options.decodedMappings ? genMapping.toDecodedMap(map) : genMapping.toEncodedMap(map);
        this.version = out.version;
        this.file = out.file;
        this.mappings = out.mappings;
        this.names = out.names;
        this.ignoreList = out.ignoreList;
        this.sourceRoot = out.sourceRoot;
        this.sources = out.sources;
        if (!options.excludeContent) {
          this.sourcesContent = out.sourcesContent;
        }
      }
      toString() {
        return JSON.stringify(this);
      }
    }
    function remapping(input, loader, options) {
      const opts = typeof options === "object" ? options : { excludeContent: !!options, decodedMappings: false };
      const tree = buildSourceMapTree(input, loader);
      return new SourceMap(traceMappings(tree), opts);
    }
    return remapping;
  });
})(remapping_umd);
const process = {};
const common = {
  filename: string("(unknown)"),
  // default to process.cwd() where it exists to replicate svelte4 behavior
  // see https://github.com/sveltejs/svelte/blob/b62fc8c8fd2640c9b99168f01b9d958cb2f7574f/packages/svelte/src/compiler/compile/Component.js#L211
  rootDir: string(typeof process !== "undefined" ? (_a = process.cwd) == null ? void 0 : _a.call(process) : void 0),
  dev: boolean(false),
  generate: validator("client", (input, keypath) => {
    if (input === "dom" || input === "ssr") {
      warn_once(options_renamed_ssr_dom);
      return input === "dom" ? "client" : "server";
    }
    if (input !== "client" && input !== "server" && input !== false) {
      throw_error(`${keypath} must be "client", "server" or false`);
    }
    return input;
  })
};
object({
  ...common,
  accessors: deprecate(options_deprecated_accessors, boolean(false)),
  css: validator("external", (input) => {
    if (input === true || input === false) {
      throw_error(
        'The boolean options have been removed from the css option. Use "external" instead of false and "injected" instead of true'
      );
    }
    if (input === "none") {
      throw_error(
        'css: "none" is no longer a valid option. If this was crucial for you, please open an issue on GitHub with your use case.'
      );
    }
    if (input !== "external" && input !== "injected") {
      throw_error(`css should be either "external" (default, recommended) or "injected"`);
    }
    return input;
  }),
  cssHash: fun(({ css, hash }) => {
    return `svelte-${hash(css)}`;
  }),
  // TODO this is a sourcemap option, would be good to put under a sourcemap namespace
  cssOutputFilename: string(void 0),
  customElement: boolean(false),
  discloseVersion: boolean(true),
  immutable: deprecate(options_deprecated_immutable, boolean(false)),
  legacy: removed(
    "The legacy option has been removed. If you are using this because of legacy.componentApi, use compatibility.componentApi instead"
  ),
  compatibility: object({
    componentApi: list([4, 5], 5)
  }),
  loopGuardTimeout: warn_removed(options_removed_loop_guard_timeout),
  name: string(void 0),
  namespace: list(["html", "mathml", "svg"]),
  modernAst: boolean(false),
  outputFilename: string(void 0),
  preserveComments: boolean(false),
  preserveWhitespace: boolean(false),
  runes: boolean(void 0),
  hmr: boolean(false),
  warningFilter: fun(() => true),
  sourcemap: validator(void 0, (input) => {
    return input;
  }),
  enableSourcemap: warn_removed(options_removed_enable_sourcemap),
  hydratable: warn_removed(options_removed_hydratable),
  format: removed(
    'The format option has been removed in Svelte 4, the compiler only outputs ESM now. Remove "format" from your compiler options. If you did not set this yourself, bump the version of your bundler plugin (vite-plugin-svelte/rollup-plugin-svelte/svelte-loader)'
  ),
  tag: removed(
    'The tag option has been removed in Svelte 5. Use `<svelte:options customElement="tag-name" />` inside the component instead. If that does not solve your use case, please open an issue on GitHub with details.'
  ),
  sveltePath: removed(
    "The sveltePath option has been removed in Svelte 5. If this option was crucial for you, please open an issue on GitHub with your use case."
  ),
  // These two were primarily created for svelte-preprocess (https://github.com/sveltejs/svelte/pull/6194),
  // but with new TypeScript compilation modes strictly separating types it's not necessary anymore
  errorMode: removed(
    "The errorMode option has been removed. If you are using this through svelte-preprocess with TypeScript, use the https://www.typescriptlang.org/tsconfig#verbatimModuleSyntax setting instead"
  ),
  varsReport: removed(
    "The vars option has been removed. If you are using this through svelte-preprocess with TypeScript, use the https://www.typescriptlang.org/tsconfig#verbatimModuleSyntax setting instead"
  )
});
function removed(msg) {
  return (input) => {
    if (input !== void 0) {
      options_removed(null, msg);
    }
    return (
      /** @type {any} */
      void 0
    );
  };
}
const warned = /* @__PURE__ */ new Set();
function warn_once(fn) {
  if (!warned.has(fn)) {
    warned.add(fn);
    fn(null);
  }
}
function warn_removed(fn) {
  return (input) => {
    if (input !== void 0) warn_once(fn);
    return (
      /** @type {any} */
      void 0
    );
  };
}
function deprecate(fn, validator2) {
  return (input, keypath) => {
    if (input !== void 0) warn_once(fn);
    return validator2(input, keypath);
  };
}
function object(children, allow_unknown = false) {
  return (input, keypath) => {
    const output = {};
    if (input && typeof input !== "object" || Array.isArray(input)) {
      throw_error(`${keypath} should be an object`);
    }
    for (const key in input) {
      if (!(key in children)) {
        if (allow_unknown) {
          output[key] = input[key];
        } else {
          options_unrecognised(null, `${keypath ? `${keypath}.${key}` : key}`);
        }
      }
    }
    for (const key in children) {
      const validator2 = children[key];
      output[key] = validator2(input && input[key], keypath ? `${keypath}.${key}` : key);
    }
    return output;
  };
}
function validator(fallback, fn) {
  return (input, keypath) => {
    return input === void 0 ? fallback : fn(input, keypath);
  };
}
function string(fallback, allow_empty = true) {
  return validator(fallback, (input, keypath) => {
    if (typeof input !== "string") {
      throw_error(`${keypath} should be a string, if specified`);
    }
    if (!allow_empty && input === "") {
      throw_error(`${keypath} cannot be empty`);
    }
    return input;
  });
}
function boolean(fallback) {
  return validator(fallback, (input, keypath) => {
    if (typeof input !== "boolean") {
      throw_error(`${keypath} should be true or false, if specified`);
    }
    return input;
  });
}
function list(options, fallback = options[0]) {
  return validator(fallback, (input, keypath) => {
    if (!options.includes(input)) {
      const msg = options.length > 2 ? `${keypath} should be one of ${options.slice(0, -1).map((input2) => `"${input2}"`).join(", ")} or "${options[options.length - 1]}"` : `${keypath} should be either "${options[0]}" or "${options[1]}"`;
      throw_error(msg);
    }
    return input;
  });
}
function fun(fallback) {
  return validator(fallback, (input, keypath) => {
    if (typeof input !== "function") {
      throw_error(`${keypath} should be a function, if specified`);
    }
    return input;
  });
}
function throw_error(msg) {
  options_invalid_value(null, msg);
}
if (typeof window !== "undefined")
  (window.__svelte || (window.__svelte = { v: /* @__PURE__ */ new Set() })).v.add(PUBLIC_VERSION);
const DEV = false;
var is_array = Array.isArray;
var array_from = Array.from;
var define_property = Object.defineProperty;
var get_descriptor = Object.getOwnPropertyDescriptor;
var get_descriptors = Object.getOwnPropertyDescriptors;
var object_prototype = Object.prototype;
var array_prototype = Array.prototype;
var get_prototype_of = Object.getPrototypeOf;
function is_function(thing) {
  return typeof thing === "function";
}
const noop = () => {
};
function run(fn) {
  return fn();
}
function run_all(arr) {
  for (var i = 0; i < arr.length; i++) {
    arr[i]();
  }
}
const DERIVED = 1 << 1;
const EFFECT = 1 << 2;
const RENDER_EFFECT = 1 << 3;
const BLOCK_EFFECT = 1 << 4;
const BRANCH_EFFECT = 1 << 5;
const ROOT_EFFECT = 1 << 6;
const UNOWNED = 1 << 7;
const DISCONNECTED = 1 << 8;
const CLEAN = 1 << 9;
const DIRTY = 1 << 10;
const MAYBE_DIRTY = 1 << 11;
const INERT = 1 << 12;
const DESTROYED = 1 << 13;
const EFFECT_RAN = 1 << 14;
const EFFECT_TRANSPARENT = 1 << 15;
const LEGACY_DERIVED_PROP = 1 << 16;
const HEAD_EFFECT = 1 << 18;
const EFFECT_HAS_DERIVED = 1 << 19;
const STATE_SYMBOL = Symbol("$state");
const LOADING_ATTR_SYMBOL = Symbol("");
function equals(value) {
  return value === this.v;
}
function safe_not_equal(a2, b2) {
  return a2 != a2 ? b2 == b2 : a2 !== b2 || a2 !== null && typeof a2 === "object" || typeof a2 === "function";
}
function safe_equals(value) {
  return !safe_not_equal(value, this.v);
}
function effect_in_teardown(rune) {
  {
    throw new Error("effect_in_teardown");
  }
}
function effect_in_unowned_derived() {
  {
    throw new Error("effect_in_unowned_derived");
  }
}
function effect_orphan(rune) {
  {
    throw new Error("effect_orphan");
  }
}
function effect_update_depth_exceeded() {
  {
    throw new Error("effect_update_depth_exceeded");
  }
}
function props_invalid_value(key) {
  {
    throw new Error("props_invalid_value");
  }
}
function state_descriptors_fixed() {
  {
    throw new Error("state_descriptors_fixed");
  }
}
function state_prototype_fixed() {
  {
    throw new Error("state_prototype_fixed");
  }
}
function state_unsafe_local_read() {
  {
    throw new Error("state_unsafe_local_read");
  }
}
function state_unsafe_mutation() {
  {
    throw new Error("state_unsafe_mutation");
  }
}
function source(v2) {
  return {
    f: 0,
    // TODO ideally we could skip this altogether, but it causes type errors
    v: v2,
    reactions: null,
    equals,
    version: 0
  };
}
function state(v2) {
  return /* @__PURE__ */ push_derived_source(source(v2));
}
// @__NO_SIDE_EFFECTS__
function mutable_source(initial_value, immutable = false) {
  var _a2;
  const s = source(initial_value);
  if (!immutable) {
    s.equals = safe_equals;
  }
  if (component_context !== null && component_context.l !== null) {
    ((_a2 = component_context.l).s ?? (_a2.s = [])).push(s);
  }
  return s;
}
function mutable_state(v2, immutable = false) {
  return /* @__PURE__ */ push_derived_source(/* @__PURE__ */ mutable_source(v2, immutable));
}
// @__NO_SIDE_EFFECTS__
function push_derived_source(source2) {
  if (active_reaction !== null && (active_reaction.f & DERIVED) !== 0) {
    if (derived_sources === null) {
      set_derived_sources([source2]);
    } else {
      derived_sources.push(source2);
    }
  }
  return source2;
}
function set(source2, value) {
  if (active_reaction !== null && is_runes() && (active_reaction.f & (DERIVED | BLOCK_EFFECT)) !== 0 && // If the source was created locally within the current derived, then
  // we allow the mutation.
  (derived_sources === null || !derived_sources.includes(source2))) {
    state_unsafe_mutation();
  }
  return internal_set(source2, value);
}
function internal_set(source2, value) {
  if (!source2.equals(value)) {
    source2.v = value;
    source2.version = increment_version();
    mark_reactions(source2, DIRTY);
    if (is_runes() && active_effect !== null && (active_effect.f & CLEAN) !== 0 && (active_effect.f & BRANCH_EFFECT) === 0) {
      if (new_deps !== null && new_deps.includes(source2)) {
        set_signal_status(active_effect, DIRTY);
        schedule_effect(active_effect);
      } else {
        if (untracked_writes === null) {
          set_untracked_writes([source2]);
        } else {
          untracked_writes.push(source2);
        }
      }
    }
  }
  return value;
}
function mark_reactions(signal, status) {
  var reactions = signal.reactions;
  if (reactions === null) return;
  var runes = is_runes();
  var length = reactions.length;
  for (var i = 0; i < length; i++) {
    var reaction = reactions[i];
    var flags = reaction.f;
    if ((flags & DIRTY) !== 0) continue;
    if (!runes && reaction === active_effect) continue;
    set_signal_status(reaction, status);
    if ((flags & (CLEAN | UNOWNED)) !== 0) {
      if ((flags & DERIVED) !== 0) {
        mark_reactions(
          /** @type {Derived} */
          reaction,
          MAYBE_DIRTY
        );
      } else {
        schedule_effect(
          /** @type {Effect} */
          reaction
        );
      }
    }
  }
}
// @__NO_SIDE_EFFECTS__
function derived(fn) {
  var flags = DERIVED | DIRTY;
  if (active_effect === null) {
    flags |= UNOWNED;
  } else {
    active_effect.f |= EFFECT_HAS_DERIVED;
  }
  const signal = {
    children: null,
    ctx: component_context,
    deps: null,
    equals,
    f: flags,
    fn,
    reactions: null,
    v: (
      /** @type {V} */
      null
    ),
    version: 0,
    parent: active_effect
  };
  if (active_reaction !== null && (active_reaction.f & DERIVED) !== 0) {
    var derived2 = (
      /** @type {Derived} */
      active_reaction
    );
    (derived2.children ?? (derived2.children = [])).push(signal);
  }
  return signal;
}
// @__NO_SIDE_EFFECTS__
function derived_safe_equal(fn) {
  const signal = /* @__PURE__ */ derived(fn);
  signal.equals = safe_equals;
  return signal;
}
function destroy_derived_children(derived2) {
  var children = derived2.children;
  if (children !== null) {
    derived2.children = null;
    for (var i = 0; i < children.length; i += 1) {
      var child2 = children[i];
      if ((child2.f & DERIVED) !== 0) {
        destroy_derived(
          /** @type {Derived} */
          child2
        );
      } else {
        destroy_effect(
          /** @type {Effect} */
          child2
        );
      }
    }
  }
}
function execute_derived(derived2) {
  var value;
  var prev_active_effect = active_effect;
  set_active_effect(derived2.parent);
  {
    try {
      destroy_derived_children(derived2);
      value = update_reaction(derived2);
    } finally {
      set_active_effect(prev_active_effect);
    }
  }
  return value;
}
function update_derived(derived2) {
  var value = execute_derived(derived2);
  var status = (skip_reaction || (derived2.f & UNOWNED) !== 0) && derived2.deps !== null ? MAYBE_DIRTY : CLEAN;
  set_signal_status(derived2, status);
  if (!derived2.equals(value)) {
    derived2.v = value;
    derived2.version = increment_version();
  }
}
function destroy_derived(signal) {
  destroy_derived_children(signal);
  remove_reactions(signal, 0);
  set_signal_status(signal, DESTROYED);
  signal.v = signal.children = signal.deps = signal.ctx = signal.reactions = null;
}
function validate_effect(rune) {
  if (active_effect === null && active_reaction === null) {
    effect_orphan();
  }
  if (active_reaction !== null && (active_reaction.f & UNOWNED) !== 0) {
    effect_in_unowned_derived();
  }
  if (is_destroying_effect) {
    effect_in_teardown();
  }
}
function push_effect(effect2, parent_effect) {
  var parent_last = parent_effect.last;
  if (parent_last === null) {
    parent_effect.last = parent_effect.first = effect2;
  } else {
    parent_last.next = effect2;
    effect2.prev = parent_last;
    parent_effect.last = effect2;
  }
}
function create_effect(type, fn, sync, push2 = true) {
  var is_root = (type & ROOT_EFFECT) !== 0;
  var parent_effect = active_effect;
  var effect2 = {
    ctx: component_context,
    deps: null,
    deriveds: null,
    nodes_start: null,
    nodes_end: null,
    f: type | DIRTY,
    first: null,
    fn,
    last: null,
    next: null,
    parent: is_root ? null : parent_effect,
    prev: null,
    teardown: null,
    transitions: null,
    version: 0
  };
  if (sync) {
    var previously_flushing_effect = is_flushing_effect;
    try {
      set_is_flushing_effect(true);
      update_effect(effect2);
      effect2.f |= EFFECT_RAN;
    } catch (e2) {
      destroy_effect(effect2);
      throw e2;
    } finally {
      set_is_flushing_effect(previously_flushing_effect);
    }
  } else if (fn !== null) {
    schedule_effect(effect2);
  }
  var inert = sync && effect2.deps === null && effect2.first === null && effect2.nodes_start === null && effect2.teardown === null && (effect2.f & EFFECT_HAS_DERIVED) === 0;
  if (!inert && !is_root && push2) {
    if (parent_effect !== null) {
      push_effect(effect2, parent_effect);
    }
    if (active_reaction !== null && (active_reaction.f & DERIVED) !== 0) {
      var derived2 = (
        /** @type {Derived} */
        active_reaction
      );
      (derived2.children ?? (derived2.children = [])).push(effect2);
    }
  }
  return effect2;
}
function teardown(fn) {
  const effect2 = create_effect(RENDER_EFFECT, null, false);
  set_signal_status(effect2, CLEAN);
  effect2.teardown = fn;
  return effect2;
}
function user_effect(fn) {
  validate_effect();
  var defer = active_effect !== null && (active_effect.f & BRANCH_EFFECT) !== 0 && component_context !== null && !component_context.m;
  if (defer) {
    var context = (
      /** @type {ComponentContext} */
      component_context
    );
    (context.e ?? (context.e = [])).push({
      fn,
      effect: active_effect,
      reaction: active_reaction
    });
  } else {
    var signal = effect(fn);
    return signal;
  }
}
function user_pre_effect(fn) {
  validate_effect();
  return render_effect(fn);
}
function effect_root(fn) {
  const effect2 = create_effect(ROOT_EFFECT, fn, true);
  return () => {
    destroy_effect(effect2);
  };
}
function effect(fn) {
  return create_effect(EFFECT, fn, false);
}
function legacy_pre_effect(deps, fn) {
  var context = (
    /** @type {ComponentContextLegacy} */
    component_context
  );
  var token = { effect: null, ran: false };
  context.l.r1.push(token);
  token.effect = render_effect(() => {
    deps();
    if (token.ran) return;
    token.ran = true;
    set(context.l.r2, true);
    untrack(fn);
  });
}
function legacy_pre_effect_reset() {
  var context = (
    /** @type {ComponentContextLegacy} */
    component_context
  );
  render_effect(() => {
    if (!get10(context.l.r2)) return;
    for (var token of context.l.r1) {
      var effect2 = token.effect;
      if ((effect2.f & CLEAN) !== 0) {
        set_signal_status(effect2, MAYBE_DIRTY);
      }
      if (check_dirtiness(effect2)) {
        update_effect(effect2);
      }
      token.ran = false;
    }
    context.l.r2.v = false;
  });
}
function render_effect(fn) {
  return create_effect(RENDER_EFFECT, fn, true);
}
function template_effect(fn) {
  return block(fn);
}
function block(fn, flags = 0) {
  return create_effect(RENDER_EFFECT | BLOCK_EFFECT | flags, fn, true);
}
function branch(fn, push2 = true) {
  return create_effect(RENDER_EFFECT | BRANCH_EFFECT, fn, true, push2);
}
function execute_effect_teardown(effect2) {
  var teardown2 = effect2.teardown;
  if (teardown2 !== null) {
    const previously_destroying_effect = is_destroying_effect;
    const previous_reaction = active_reaction;
    set_is_destroying_effect(true);
    set_active_reaction(null);
    try {
      teardown2.call(null);
    } finally {
      set_is_destroying_effect(previously_destroying_effect);
      set_active_reaction(previous_reaction);
    }
  }
}
function destroy_effect_deriveds(signal) {
  var deriveds = signal.deriveds;
  if (deriveds !== null) {
    signal.deriveds = null;
    for (var i = 0; i < deriveds.length; i += 1) {
      destroy_derived(deriveds[i]);
    }
  }
}
function destroy_effect_children(signal, remove_dom = false) {
  var effect2 = signal.first;
  signal.first = signal.last = null;
  while (effect2 !== null) {
    var next = effect2.next;
    destroy_effect(effect2, remove_dom);
    effect2 = next;
  }
}
function destroy_block_effect_children(signal) {
  var effect2 = signal.first;
  while (effect2 !== null) {
    var next = effect2.next;
    if ((effect2.f & BRANCH_EFFECT) === 0) {
      destroy_effect(effect2);
    }
    effect2 = next;
  }
}
function destroy_effect(effect2, remove_dom = true) {
  var removed2 = false;
  if ((remove_dom || (effect2.f & HEAD_EFFECT) !== 0) && effect2.nodes_start !== null) {
    var node = effect2.nodes_start;
    var end = effect2.nodes_end;
    while (node !== null) {
      var next = node === end ? null : (
        /** @type {TemplateNode} */
        /* @__PURE__ */ get_next_sibling(node)
      );
      node.remove();
      node = next;
    }
    removed2 = true;
  }
  destroy_effect_deriveds(effect2);
  destroy_effect_children(effect2, remove_dom && !removed2);
  remove_reactions(effect2, 0);
  set_signal_status(effect2, DESTROYED);
  var transitions = effect2.transitions;
  if (transitions !== null) {
    for (const transition of transitions) {
      transition.stop();
    }
  }
  execute_effect_teardown(effect2);
  var parent = effect2.parent;
  if (parent !== null && parent.first !== null) {
    unlink_effect(effect2);
  }
  effect2.next = effect2.prev = effect2.teardown = effect2.ctx = effect2.deps = effect2.parent = effect2.fn = effect2.nodes_start = effect2.nodes_end = null;
}
function unlink_effect(effect2) {
  var parent = effect2.parent;
  var prev = effect2.prev;
  var next = effect2.next;
  if (prev !== null) prev.next = next;
  if (next !== null) next.prev = prev;
  if (parent !== null) {
    if (parent.first === effect2) parent.first = next;
    if (parent.last === effect2) parent.last = prev;
  }
}
function pause_effect(effect2, callback) {
  var transitions = [];
  pause_children(effect2, transitions, true);
  run_out_transitions(transitions, () => {
    destroy_effect(effect2);
    if (callback) callback();
  });
}
function run_out_transitions(transitions, fn) {
  var remaining = transitions.length;
  if (remaining > 0) {
    var check = () => --remaining || fn();
    for (var transition of transitions) {
      transition.out(check);
    }
  } else {
    fn();
  }
}
function pause_children(effect2, transitions, local) {
  if ((effect2.f & INERT) !== 0) return;
  effect2.f ^= INERT;
  if (effect2.transitions !== null) {
    for (const transition of effect2.transitions) {
      if (transition.is_global || local) {
        transitions.push(transition);
      }
    }
  }
  var child2 = effect2.first;
  while (child2 !== null) {
    var sibling3 = child2.next;
    var transparent = (child2.f & EFFECT_TRANSPARENT) !== 0 || (child2.f & BRANCH_EFFECT) !== 0;
    pause_children(child2, transitions, transparent ? local : false);
    child2 = sibling3;
  }
}
function resume_effect(effect2) {
  resume_children(effect2, true);
}
function resume_children(effect2, local) {
  if ((effect2.f & INERT) === 0) return;
  effect2.f ^= INERT;
  if (check_dirtiness(effect2)) {
    update_effect(effect2);
  }
  var child2 = effect2.first;
  while (child2 !== null) {
    var sibling3 = child2.next;
    var transparent = (child2.f & EFFECT_TRANSPARENT) !== 0 || (child2.f & BRANCH_EFFECT) !== 0;
    resume_children(child2, transparent ? local : false);
    child2 = sibling3;
  }
  if (effect2.transitions !== null) {
    for (const transition of effect2.transitions) {
      if (transition.is_global || local) {
        transition.in();
      }
    }
  }
}
let is_micro_task_queued$1 = false;
let current_queued_micro_tasks = [];
function process_micro_tasks() {
  is_micro_task_queued$1 = false;
  const tasks = current_queued_micro_tasks.slice();
  current_queued_micro_tasks = [];
  run_all(tasks);
}
function queue_micro_task(fn) {
  if (!is_micro_task_queued$1) {
    is_micro_task_queued$1 = true;
    queueMicrotask(process_micro_tasks);
  }
  current_queued_micro_tasks.push(fn);
}
let is_micro_task_queued = false;
let is_flushing_effect = false;
let is_destroying_effect = false;
function set_is_flushing_effect(value) {
  is_flushing_effect = value;
}
function set_is_destroying_effect(value) {
  is_destroying_effect = value;
}
let queued_root_effects = [];
let flush_count = 0;
let dev_effect_stack = [];
let active_reaction = null;
function set_active_reaction(reaction) {
  active_reaction = reaction;
}
let active_effect = null;
function set_active_effect(effect2) {
  active_effect = effect2;
}
let derived_sources = null;
function set_derived_sources(sources) {
  derived_sources = sources;
}
let new_deps = null;
let skipped_deps = 0;
let untracked_writes = null;
function set_untracked_writes(value) {
  untracked_writes = value;
}
let current_version = 0;
let skip_reaction = false;
let component_context = null;
function increment_version() {
  return ++current_version;
}
function is_runes() {
  return component_context !== null && component_context.l === null;
}
function check_dirtiness(reaction) {
  var _a2, _b;
  var flags = reaction.f;
  if ((flags & DIRTY) !== 0) {
    return true;
  }
  if ((flags & MAYBE_DIRTY) !== 0) {
    var dependencies = reaction.deps;
    var is_unowned = (flags & UNOWNED) !== 0;
    if (dependencies !== null) {
      var i;
      if ((flags & DISCONNECTED) !== 0) {
        for (i = 0; i < dependencies.length; i++) {
          ((_a2 = dependencies[i]).reactions ?? (_a2.reactions = [])).push(reaction);
        }
        reaction.f ^= DISCONNECTED;
      }
      for (i = 0; i < dependencies.length; i++) {
        var dependency = dependencies[i];
        if (check_dirtiness(
          /** @type {Derived} */
          dependency
        )) {
          update_derived(
            /** @type {Derived} */
            dependency
          );
        }
        if (is_unowned && active_effect !== null && !skip_reaction && !((_b = dependency == null ? void 0 : dependency.reactions) == null ? void 0 : _b.includes(reaction))) {
          (dependency.reactions ?? (dependency.reactions = [])).push(reaction);
        }
        if (dependency.version > reaction.version) {
          return true;
        }
      }
    }
    if (!is_unowned) {
      set_signal_status(reaction, CLEAN);
    }
  }
  return false;
}
function handle_error(error, effect2, component_context2) {
  {
    throw error;
  }
}
function update_reaction(reaction) {
  var _a2;
  var previous_deps = new_deps;
  var previous_skipped_deps = skipped_deps;
  var previous_untracked_writes = untracked_writes;
  var previous_reaction = active_reaction;
  var previous_skip_reaction = skip_reaction;
  var prev_derived_sources = derived_sources;
  var previous_component_context = component_context;
  var flags = reaction.f;
  new_deps = /** @type {null | Value[]} */
  null;
  skipped_deps = 0;
  untracked_writes = null;
  active_reaction = (flags & (BRANCH_EFFECT | ROOT_EFFECT)) === 0 ? reaction : null;
  skip_reaction = !is_flushing_effect && (flags & UNOWNED) !== 0;
  derived_sources = null;
  component_context = reaction.ctx;
  try {
    var result = (
      /** @type {Function} */
      (0, reaction.fn)()
    );
    var deps = reaction.deps;
    if (new_deps !== null) {
      var i;
      remove_reactions(reaction, skipped_deps);
      if (deps !== null && skipped_deps > 0) {
        deps.length = skipped_deps + new_deps.length;
        for (i = 0; i < new_deps.length; i++) {
          deps[skipped_deps + i] = new_deps[i];
        }
      } else {
        reaction.deps = deps = new_deps;
      }
      if (!skip_reaction) {
        for (i = skipped_deps; i < deps.length; i++) {
          ((_a2 = deps[i]).reactions ?? (_a2.reactions = [])).push(reaction);
        }
      }
    } else if (deps !== null && skipped_deps < deps.length) {
      remove_reactions(reaction, skipped_deps);
      deps.length = skipped_deps;
    }
    return result;
  } finally {
    new_deps = previous_deps;
    skipped_deps = previous_skipped_deps;
    untracked_writes = previous_untracked_writes;
    active_reaction = previous_reaction;
    skip_reaction = previous_skip_reaction;
    derived_sources = prev_derived_sources;
    component_context = previous_component_context;
  }
}
function remove_reaction(signal, dependency) {
  let reactions = dependency.reactions;
  if (reactions !== null) {
    var index2 = reactions.indexOf(signal);
    if (index2 !== -1) {
      var new_length = reactions.length - 1;
      if (new_length === 0) {
        reactions = dependency.reactions = null;
      } else {
        reactions[index2] = reactions[new_length];
        reactions.pop();
      }
    }
  }
  if (reactions === null && (dependency.f & DERIVED) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (new_deps === null || !new_deps.includes(dependency))) {
    set_signal_status(dependency, MAYBE_DIRTY);
    if ((dependency.f & (UNOWNED | DISCONNECTED)) === 0) {
      dependency.f ^= DISCONNECTED;
    }
    remove_reactions(
      /** @type {Derived} **/
      dependency,
      0
    );
  }
}
function remove_reactions(signal, start_index) {
  var dependencies = signal.deps;
  if (dependencies === null) return;
  for (var i = start_index; i < dependencies.length; i++) {
    remove_reaction(signal, dependencies[i]);
  }
}
function update_effect(effect2) {
  var flags = effect2.f;
  if ((flags & DESTROYED) !== 0) {
    return;
  }
  set_signal_status(effect2, CLEAN);
  var previous_effect = active_effect;
  active_effect = effect2;
  try {
    destroy_effect_deriveds(effect2);
    if ((flags & BLOCK_EFFECT) !== 0) {
      destroy_block_effect_children(effect2);
    } else {
      destroy_effect_children(effect2);
    }
    execute_effect_teardown(effect2);
    var teardown2 = update_reaction(effect2);
    effect2.teardown = typeof teardown2 === "function" ? teardown2 : null;
    effect2.version = current_version;
    if (DEV) ;
  } catch (error) {
    handle_error(
      /** @type {Error} */
      error
    );
  } finally {
    active_effect = previous_effect;
  }
}
function infinite_loop_guard() {
  if (flush_count > 1e3) {
    flush_count = 0;
    {
      effect_update_depth_exceeded();
    }
  }
  flush_count++;
}
function flush_queued_root_effects(root_effects) {
  var length = root_effects.length;
  if (length === 0) {
    return;
  }
  infinite_loop_guard();
  var previously_flushing_effect = is_flushing_effect;
  is_flushing_effect = true;
  try {
    for (var i = 0; i < length; i++) {
      var effect2 = root_effects[i];
      if ((effect2.f & CLEAN) === 0) {
        effect2.f ^= CLEAN;
      }
      var collected_effects = [];
      process_effects(effect2, collected_effects);
      flush_queued_effects(collected_effects);
    }
  } finally {
    is_flushing_effect = previously_flushing_effect;
  }
}
function flush_queued_effects(effects) {
  var length = effects.length;
  if (length === 0) return;
  for (var i = 0; i < length; i++) {
    var effect2 = effects[i];
    if ((effect2.f & (DESTROYED | INERT)) === 0 && check_dirtiness(effect2)) {
      update_effect(effect2);
      if (effect2.deps === null && effect2.first === null && effect2.nodes_start === null) {
        if (effect2.teardown === null) {
          unlink_effect(effect2);
        } else {
          effect2.fn = null;
        }
      }
    }
  }
}
function process_deferred() {
  is_micro_task_queued = false;
  if (flush_count > 1001) {
    return;
  }
  const previous_queued_root_effects = queued_root_effects;
  queued_root_effects = [];
  flush_queued_root_effects(previous_queued_root_effects);
  if (!is_micro_task_queued) {
    flush_count = 0;
  }
}
function schedule_effect(signal) {
  {
    if (!is_micro_task_queued) {
      is_micro_task_queued = true;
      queueMicrotask(process_deferred);
    }
  }
  var effect2 = signal;
  while (effect2.parent !== null) {
    effect2 = effect2.parent;
    var flags = effect2.f;
    if ((flags & (ROOT_EFFECT | BRANCH_EFFECT)) !== 0) {
      if ((flags & CLEAN) === 0) return;
      effect2.f ^= CLEAN;
    }
  }
  queued_root_effects.push(effect2);
}
function process_effects(effect2, collected_effects) {
  var current_effect = effect2.first;
  var effects = [];
  main_loop: while (current_effect !== null) {
    var flags = current_effect.f;
    var is_branch = (flags & BRANCH_EFFECT) !== 0;
    var is_skippable_branch = is_branch && (flags & CLEAN) !== 0;
    if (!is_skippable_branch && (flags & INERT) === 0) {
      if ((flags & RENDER_EFFECT) !== 0) {
        if (is_branch) {
          current_effect.f ^= CLEAN;
        } else if (check_dirtiness(current_effect)) {
          update_effect(current_effect);
        }
        var child2 = current_effect.first;
        if (child2 !== null) {
          current_effect = child2;
          continue;
        }
      } else if ((flags & EFFECT) !== 0) {
        effects.push(current_effect);
      }
    }
    var sibling3 = current_effect.next;
    if (sibling3 === null) {
      let parent = current_effect.parent;
      while (parent !== null) {
        if (effect2 === parent) {
          break main_loop;
        }
        var parent_sibling = parent.next;
        if (parent_sibling !== null) {
          current_effect = parent_sibling;
          continue main_loop;
        }
        parent = parent.parent;
      }
    }
    current_effect = sibling3;
  }
  for (var i = 0; i < effects.length; i++) {
    child2 = effects[i];
    collected_effects.push(child2);
    process_effects(child2, collected_effects);
  }
}
function get10(signal) {
  var _a2;
  var flags = signal.f;
  var is_derived = (flags & DERIVED) !== 0;
  if (is_derived && (flags & DESTROYED) !== 0) {
    var value = execute_derived(
      /** @type {Derived} */
      signal
    );
    destroy_derived(
      /** @type {Derived} */
      signal
    );
    return value;
  }
  if (active_reaction !== null) {
    if (derived_sources !== null && derived_sources.includes(signal)) {
      state_unsafe_local_read();
    }
    var deps = active_reaction.deps;
    if (new_deps === null && deps !== null && deps[skipped_deps] === signal) {
      skipped_deps++;
    } else if (new_deps === null) {
      new_deps = [signal];
    } else {
      new_deps.push(signal);
    }
    if (untracked_writes !== null && active_effect !== null && (active_effect.f & CLEAN) !== 0 && (active_effect.f & BRANCH_EFFECT) === 0 && untracked_writes.includes(signal)) {
      set_signal_status(active_effect, DIRTY);
      schedule_effect(active_effect);
    }
  } else if (is_derived && /** @type {Derived} */
  signal.deps === null) {
    var derived2 = (
      /** @type {Derived} */
      signal
    );
    var parent = derived2.parent;
    if (parent !== null && !((_a2 = parent.deriveds) == null ? void 0 : _a2.includes(derived2))) {
      (parent.deriveds ?? (parent.deriveds = [])).push(derived2);
    }
  }
  if (is_derived) {
    derived2 = /** @type {Derived} */
    signal;
    if (check_dirtiness(derived2)) {
      update_derived(derived2);
    }
  }
  return signal.v;
}
function untrack(fn) {
  const previous_reaction = active_reaction;
  try {
    active_reaction = null;
    return fn();
  } finally {
    active_reaction = previous_reaction;
  }
}
const STATUS_MASK = ~(DIRTY | MAYBE_DIRTY | CLEAN);
function set_signal_status(signal, status) {
  signal.f = signal.f & STATUS_MASK | status;
}
function update(signal, d2 = 1) {
  var value = +get10(signal);
  set(signal, value + d2);
  return value;
}
function push(props, runes = false, fn) {
  component_context = {
    p: component_context,
    c: null,
    e: null,
    m: false,
    s: props,
    x: null,
    l: null
  };
  if (!runes) {
    component_context.l = {
      s: null,
      u: null,
      r1: [],
      r2: source(false)
    };
  }
}
function pop(component) {
  const context_stack_item = component_context;
  if (context_stack_item !== null) {
    const component_effects = context_stack_item.e;
    if (component_effects !== null) {
      var previous_effect = active_effect;
      var previous_reaction = active_reaction;
      context_stack_item.e = null;
      try {
        for (var i = 0; i < component_effects.length; i++) {
          var component_effect = component_effects[i];
          set_active_effect(component_effect.effect);
          set_active_reaction(component_effect.reaction);
          effect(component_effect.fn);
        }
      } finally {
        set_active_effect(previous_effect);
        set_active_reaction(previous_reaction);
      }
    }
    component_context = context_stack_item.p;
    context_stack_item.m = true;
  }
  return (
    /** @type {T} */
    {}
  );
}
function deep_read_state(value) {
  if (typeof value !== "object" || !value || value instanceof EventTarget) {
    return;
  }
  if (STATE_SYMBOL in value) {
    deep_read(value);
  } else if (!Array.isArray(value)) {
    for (let key in value) {
      const prop2 = value[key];
      if (typeof prop2 === "object" && prop2 && STATE_SYMBOL in prop2) {
        deep_read(prop2);
      }
    }
  }
}
function deep_read(value, visited = /* @__PURE__ */ new Set()) {
  if (typeof value === "object" && value !== null && // We don't want to traverse DOM elements
  !(value instanceof EventTarget) && !visited.has(value)) {
    visited.add(value);
    if (value instanceof Date) {
      value.getTime();
    }
    for (let key in value) {
      try {
        deep_read(value[key], visited);
      } catch (e2) {
      }
    }
    const proto = get_prototype_of(value);
    if (proto !== Object.prototype && proto !== Array.prototype && proto !== Map.prototype && proto !== Set.prototype && proto !== Date.prototype) {
      const descriptors = get_descriptors(proto);
      for (let key in descriptors) {
        const get11 = descriptors[key].get;
        if (get11) {
          try {
            get11.call(value);
          } catch (e2) {
          }
        }
      }
    }
  }
}
function proxy(value, parent = null, prev) {
  if (typeof value !== "object" || value === null || STATE_SYMBOL in value) {
    return value;
  }
  const prototype = get_prototype_of(value);
  if (prototype !== object_prototype && prototype !== array_prototype) {
    return value;
  }
  var sources = /* @__PURE__ */ new Map();
  var is_proxied_array = is_array(value);
  var version2 = source(0);
  if (is_proxied_array) {
    sources.set("length", source(
      /** @type {any[]} */
      value.length
    ));
  }
  var metadata;
  return new Proxy(
    /** @type {any} */
    value,
    {
      defineProperty(_, prop2, descriptor) {
        if (!("value" in descriptor) || descriptor.configurable === false || descriptor.enumerable === false || descriptor.writable === false) {
          state_descriptors_fixed();
        }
        var s = sources.get(prop2);
        if (s === void 0) {
          s = source(descriptor.value);
          sources.set(prop2, s);
        } else {
          set(s, proxy(descriptor.value, metadata));
        }
        return true;
      },
      deleteProperty(target, prop2) {
        var s = sources.get(prop2);
        if (s === void 0) {
          if (prop2 in target) {
            sources.set(prop2, source(UNINITIALIZED));
          }
        } else {
          if (is_proxied_array && typeof prop2 === "string") {
            var ls = (
              /** @type {Source<number>} */
              sources.get("length")
            );
            var n2 = Number(prop2);
            if (Number.isInteger(n2) && n2 < ls.v) {
              set(ls, n2);
            }
          }
          set(s, UNINITIALIZED);
          update_version(version2);
        }
        return true;
      },
      get(target, prop2, receiver) {
        var _a2;
        if (prop2 === STATE_SYMBOL) {
          return value;
        }
        var s = sources.get(prop2);
        var exists = prop2 in target;
        if (s === void 0 && (!exists || ((_a2 = get_descriptor(target, prop2)) == null ? void 0 : _a2.writable))) {
          s = source(proxy(exists ? target[prop2] : UNINITIALIZED, metadata));
          sources.set(prop2, s);
        }
        if (s !== void 0) {
          var v2 = get10(s);
          return v2 === UNINITIALIZED ? void 0 : v2;
        }
        return Reflect.get(target, prop2, receiver);
      },
      getOwnPropertyDescriptor(target, prop2) {
        var descriptor = Reflect.getOwnPropertyDescriptor(target, prop2);
        if (descriptor && "value" in descriptor) {
          var s = sources.get(prop2);
          if (s) descriptor.value = get10(s);
        } else if (descriptor === void 0) {
          var source2 = sources.get(prop2);
          var value2 = source2 == null ? void 0 : source2.v;
          if (source2 !== void 0 && value2 !== UNINITIALIZED) {
            return {
              enumerable: true,
              configurable: true,
              value: value2,
              writable: true
            };
          }
        }
        return descriptor;
      },
      has(target, prop2) {
        var _a2;
        if (prop2 === STATE_SYMBOL) {
          return true;
        }
        var s = sources.get(prop2);
        var has10 = s !== void 0 && s.v !== UNINITIALIZED || Reflect.has(target, prop2);
        if (s !== void 0 || active_effect !== null && (!has10 || ((_a2 = get_descriptor(target, prop2)) == null ? void 0 : _a2.writable))) {
          if (s === void 0) {
            s = source(has10 ? proxy(target[prop2], metadata) : UNINITIALIZED);
            sources.set(prop2, s);
          }
          var value2 = get10(s);
          if (value2 === UNINITIALIZED) {
            return false;
          }
        }
        return has10;
      },
      set(target, prop2, value2, receiver) {
        var _a2;
        var s = sources.get(prop2);
        var has10 = prop2 in target;
        if (is_proxied_array && prop2 === "length") {
          for (var i = value2; i < /** @type {Source<number>} */
          s.v; i += 1) {
            var other_s = sources.get(i + "");
            if (other_s !== void 0) {
              set(other_s, UNINITIALIZED);
            } else if (i in target) {
              other_s = source(UNINITIALIZED);
              sources.set(i + "", other_s);
            }
          }
        }
        if (s === void 0) {
          if (!has10 || ((_a2 = get_descriptor(target, prop2)) == null ? void 0 : _a2.writable)) {
            s = source(void 0);
            set(s, proxy(value2, metadata));
            sources.set(prop2, s);
          }
        } else {
          has10 = s.v !== UNINITIALIZED;
          set(s, proxy(value2, metadata));
        }
        var descriptor = Reflect.getOwnPropertyDescriptor(target, prop2);
        if (descriptor == null ? void 0 : descriptor.set) {
          descriptor.set.call(receiver, value2);
        }
        if (!has10) {
          if (is_proxied_array && typeof prop2 === "string") {
            var ls = (
              /** @type {Source<number>} */
              sources.get("length")
            );
            var n2 = Number(prop2);
            if (Number.isInteger(n2) && n2 >= ls.v) {
              set(ls, n2 + 1);
            }
          }
          update_version(version2);
        }
        return true;
      },
      ownKeys(target) {
        get10(version2);
        var own_keys = Reflect.ownKeys(target).filter((key2) => {
          var source3 = sources.get(key2);
          return source3 === void 0 || source3.v !== UNINITIALIZED;
        });
        for (var [key, source2] of sources) {
          if (source2.v !== UNINITIALIZED && !(key in target)) {
            own_keys.push(key);
          }
        }
        return own_keys;
      },
      setPrototypeOf() {
        state_prototype_fixed();
      }
    }
  );
}
function update_version(signal, d2 = 1) {
  set(signal, signal.v + d2);
}
function get_proxied_value(value) {
  if (value !== null && typeof value === "object" && STATE_SYMBOL in value) {
    return value[STATE_SYMBOL];
  }
  return value;
}
function is(a2, b2) {
  return Object.is(get_proxied_value(a2), get_proxied_value(b2));
}
var $window;
var first_child_getter;
var next_sibling_getter;
function init_operations() {
  if ($window !== void 0) {
    return;
  }
  $window = window;
  var element_prototype = Element.prototype;
  var node_prototype = Node.prototype;
  first_child_getter = get_descriptor(node_prototype, "firstChild").get;
  next_sibling_getter = get_descriptor(node_prototype, "nextSibling").get;
  element_prototype.__click = void 0;
  element_prototype.__className = "";
  element_prototype.__attributes = null;
  element_prototype.__styles = null;
  element_prototype.__e = void 0;
  Text.prototype.__t = void 0;
}
function create_text(value = "") {
  return document.createTextNode(value);
}
// @__NO_SIDE_EFFECTS__
function get_first_child(node) {
  return first_child_getter.call(node);
}
// @__NO_SIDE_EFFECTS__
function get_next_sibling(node) {
  return next_sibling_getter.call(node);
}
function child(node, is_text) {
  {
    return /* @__PURE__ */ get_first_child(node);
  }
}
function first_child(fragment, is_text) {
  {
    var first = (
      /** @type {DocumentFragment} */
      /* @__PURE__ */ get_first_child(
        /** @type {Node} */
        fragment
      )
    );
    if (first instanceof Comment && first.data === "") return /* @__PURE__ */ get_next_sibling(first);
    return first;
  }
}
function sibling2(node, count = 1, is_text = false) {
  let next_sibling = node;
  while (count--) {
    next_sibling = /** @type {TemplateNode} */
    /* @__PURE__ */ get_next_sibling(next_sibling);
  }
  {
    return next_sibling;
  }
}
function clear_text_content(node) {
  node.textContent = "";
}
let hydrating = false;
const all_registered_events = /* @__PURE__ */ new Set();
const root_event_handles = /* @__PURE__ */ new Set();
function create_event(event_name, dom2, handler, options) {
  function target_handler(event) {
    if (!options.capture) {
      handle_event_propagation.call(dom2, event);
    }
    if (!event.cancelBubble) {
      var previous_reaction = active_reaction;
      var previous_effect = active_effect;
      set_active_reaction(null);
      set_active_effect(null);
      try {
        return handler.call(this, event);
      } finally {
        set_active_reaction(previous_reaction);
        set_active_effect(previous_effect);
      }
    }
  }
  if (event_name.startsWith("pointer") || event_name.startsWith("touch") || event_name === "wheel") {
    queue_micro_task(() => {
      dom2.addEventListener(event_name, target_handler, options);
    });
  } else {
    dom2.addEventListener(event_name, target_handler, options);
  }
  return target_handler;
}
function delegate(events) {
  for (var i = 0; i < events.length; i++) {
    all_registered_events.add(events[i]);
  }
  for (var fn of root_event_handles) {
    fn(events);
  }
}
function handle_event_propagation(event) {
  var _a2;
  var handler_element = this;
  var owner_document = (
    /** @type {Node} */
    handler_element.ownerDocument
  );
  var event_name = event.type;
  var path = ((_a2 = event.composedPath) == null ? void 0 : _a2.call(event)) || [];
  var current_target = (
    /** @type {null | Element} */
    path[0] || event.target
  );
  var path_idx = 0;
  var handled_at = event.__root;
  if (handled_at) {
    var at_idx = path.indexOf(handled_at);
    if (at_idx !== -1 && (handler_element === document || handler_element === /** @type {any} */
    window)) {
      event.__root = handler_element;
      return;
    }
    var handler_idx = path.indexOf(handler_element);
    if (handler_idx === -1) {
      return;
    }
    if (at_idx <= handler_idx) {
      path_idx = at_idx;
    }
  }
  current_target = /** @type {Element} */
  path[path_idx] || event.target;
  if (current_target === handler_element) return;
  define_property(event, "currentTarget", {
    configurable: true,
    get() {
      return current_target || owner_document;
    }
  });
  var previous_reaction = active_reaction;
  var previous_effect = active_effect;
  set_active_reaction(null);
  set_active_effect(null);
  try {
    var throw_error2;
    var other_errors = [];
    while (current_target !== null) {
      var parent_element = current_target.assignedSlot || current_target.parentNode || /** @type {any} */
      current_target.host || null;
      try {
        var delegated = current_target["__" + event_name];
        if (delegated !== void 0 && !/** @type {any} */
        current_target.disabled) {
          if (is_array(delegated)) {
            var [fn, ...data2] = delegated;
            fn.apply(current_target, [event, ...data2]);
          } else {
            delegated.call(current_target, event);
          }
        }
      } catch (error) {
        if (throw_error2) {
          other_errors.push(error);
        } else {
          throw_error2 = error;
        }
      }
      if (event.cancelBubble || parent_element === handler_element || parent_element === null) {
        break;
      }
      current_target = parent_element;
    }
    if (throw_error2) {
      for (let error of other_errors) {
        queueMicrotask(() => {
          throw error;
        });
      }
      throw throw_error2;
    }
  } finally {
    event.__root = handler_element;
    delete event.currentTarget;
    set_active_reaction(previous_reaction);
    set_active_effect(previous_effect);
  }
}
function create_fragment_from_html(html) {
  var elem = document.createElement("template");
  elem.innerHTML = html;
  return elem.content;
}
function assign_nodes(start, end) {
  var effect2 = (
    /** @type {Effect} */
    active_effect
  );
  if (effect2.nodes_start === null) {
    effect2.nodes_start = start;
    effect2.nodes_end = end;
  }
}
// @__NO_SIDE_EFFECTS__
function template(content, flags) {
  var is_fragment = (flags & TEMPLATE_FRAGMENT) !== 0;
  var use_import_node = (flags & TEMPLATE_USE_IMPORT_NODE) !== 0;
  var node;
  var has_start = !content.startsWith("<!>");
  return () => {
    if (node === void 0) {
      node = create_fragment_from_html(has_start ? content : "<!>" + content);
      if (!is_fragment) node = /** @type {Node} */
      /* @__PURE__ */ get_first_child(node);
    }
    var clone = (
      /** @type {TemplateNode} */
      use_import_node ? document.importNode(node, true) : node.cloneNode(true)
    );
    if (is_fragment) {
      var start = (
        /** @type {TemplateNode} */
        /* @__PURE__ */ get_first_child(clone)
      );
      var end = (
        /** @type {TemplateNode} */
        clone.lastChild
      );
      assign_nodes(start, end);
    } else {
      assign_nodes(clone, clone);
    }
    return clone;
  };
}
// @__NO_SIDE_EFFECTS__
function ns_template(content, flags, ns = "svg") {
  var has_start = !content.startsWith("<!>");
  var wrapped = `<${ns}>${has_start ? content : "<!>" + content}</${ns}>`;
  var node;
  return () => {
    if (!node) {
      var fragment = (
        /** @type {DocumentFragment} */
        create_fragment_from_html(wrapped)
      );
      var root2 = (
        /** @type {Element} */
        /* @__PURE__ */ get_first_child(fragment)
      );
      {
        node = /** @type {Element} */
        /* @__PURE__ */ get_first_child(root2);
      }
    }
    var clone = (
      /** @type {TemplateNode} */
      node.cloneNode(true)
    );
    {
      assign_nodes(clone, clone);
    }
    return clone;
  };
}
function text(value = "") {
  {
    var t2 = create_text(value + "");
    assign_nodes(t2, t2);
    return t2;
  }
}
function comment() {
  var frag = document.createDocumentFragment();
  var start = document.createComment("");
  var anchor = create_text();
  frag.append(start, anchor);
  assign_nodes(start, anchor);
  return frag;
}
function append(anchor, dom2) {
  if (anchor === null) {
    return;
  }
  anchor.before(
    /** @type {Node} */
    dom2
  );
}
function set_text(text2, value) {
  var str = value == null ? "" : typeof value === "object" ? value + "" : value;
  if (str !== (text2.__t ?? (text2.__t = text2.nodeValue))) {
    text2.__t = str;
    text2.nodeValue = str == null ? "" : str + "";
  }
}
function mount(component, options) {
  return _mount(component, options);
}
const document_listeners = /* @__PURE__ */ new Map();
function _mount(Component, { target, anchor, props = {}, events, context, intro = true }) {
  init_operations();
  var registered_events = /* @__PURE__ */ new Set();
  var event_handle = (events2) => {
    for (var i = 0; i < events2.length; i++) {
      var event_name = events2[i];
      if (registered_events.has(event_name)) continue;
      registered_events.add(event_name);
      var passive = is_passive_event(event_name);
      target.addEventListener(event_name, handle_event_propagation, { passive });
      var n2 = document_listeners.get(event_name);
      if (n2 === void 0) {
        document.addEventListener(event_name, handle_event_propagation, { passive });
        document_listeners.set(event_name, 1);
      } else {
        document_listeners.set(event_name, n2 + 1);
      }
    }
  };
  event_handle(array_from(all_registered_events));
  root_event_handles.add(event_handle);
  var component = void 0;
  var unmount = effect_root(() => {
    var anchor_node = anchor ?? target.appendChild(create_text());
    branch(() => {
      if (context) {
        push({});
        var ctx = (
          /** @type {ComponentContext} */
          component_context
        );
        ctx.c = context;
      }
      if (events) {
        props.$$events = events;
      }
      component = Component(anchor_node, props) || {};
      if (context) {
        pop();
      }
    });
    return () => {
      var _a2;
      for (var event_name of registered_events) {
        target.removeEventListener(event_name, handle_event_propagation);
        var n2 = (
          /** @type {number} */
          document_listeners.get(event_name)
        );
        if (--n2 === 0) {
          document.removeEventListener(event_name, handle_event_propagation);
          document_listeners.delete(event_name);
        } else {
          document_listeners.set(event_name, n2);
        }
      }
      root_event_handles.delete(event_handle);
      mounted_components.delete(component);
      if (anchor_node !== anchor) {
        (_a2 = anchor_node.parentNode) == null ? void 0 : _a2.removeChild(anchor_node);
      }
    };
  });
  mounted_components.set(component, unmount);
  return component;
}
let mounted_components = /* @__PURE__ */ new WeakMap();
function if_block(node, get_condition, consequent_fn, alternate_fn = null, elseif = false) {
  var anchor = node;
  var consequent_effect = null;
  var alternate_effect = null;
  var condition = null;
  var flags = elseif ? EFFECT_TRANSPARENT : 0;
  block(() => {
    if (condition === (condition = !!get_condition())) return;
    if (condition) {
      if (consequent_effect) {
        resume_effect(consequent_effect);
      } else {
        consequent_effect = branch(() => consequent_fn(anchor));
      }
      if (alternate_effect) {
        pause_effect(alternate_effect, () => {
          alternate_effect = null;
        });
      }
    } else {
      if (alternate_effect) {
        resume_effect(alternate_effect);
      } else if (alternate_fn) {
        alternate_effect = branch(() => alternate_fn(anchor));
      }
      if (consequent_effect) {
        pause_effect(consequent_effect, () => {
          consequent_effect = null;
        });
      }
    }
  }, flags);
}
function key_block(node, get_key, render_fn) {
  var anchor = node;
  var key = UNINITIALIZED;
  var effect2;
  block(() => {
    if (safe_not_equal(key, key = get_key())) {
      if (effect2) {
        pause_effect(effect2);
      }
      effect2 = branch(() => render_fn(anchor));
    }
  });
}
let current_each_item = null;
function set_current_each_item(item) {
  current_each_item = item;
}
function index(_, i) {
  return i;
}
function pause_effects(state2, items, controlled_anchor, items_map) {
  var transitions = [];
  var length = items.length;
  for (var i = 0; i < length; i++) {
    pause_children(items[i].e, transitions, true);
  }
  var is_controlled = length > 0 && transitions.length === 0 && controlled_anchor !== null;
  if (is_controlled) {
    var parent_node = (
      /** @type {Element} */
      /** @type {Element} */
      controlled_anchor.parentNode
    );
    clear_text_content(parent_node);
    parent_node.append(
      /** @type {Element} */
      controlled_anchor
    );
    items_map.clear();
    link(state2, items[0].prev, items[length - 1].next);
  }
  run_out_transitions(transitions, () => {
    for (var i2 = 0; i2 < length; i2++) {
      var item = items[i2];
      if (!is_controlled) {
        items_map.delete(item.k);
        link(state2, item.prev, item.next);
      }
      destroy_effect(item.e, !is_controlled);
    }
  });
}
function each(node, flags, get_collection, get_key, render_fn, fallback_fn = null) {
  var anchor = node;
  var state2 = { flags, items: /* @__PURE__ */ new Map(), first: null };
  var is_controlled = (flags & EACH_IS_CONTROLLED) !== 0;
  if (is_controlled) {
    var parent_node = (
      /** @type {Element} */
      node
    );
    anchor = parent_node.appendChild(create_text());
  }
  var fallback = null;
  var was_empty = false;
  block(() => {
    var collection = get_collection();
    var array = is_array(collection) ? collection : collection == null ? [] : array_from(collection);
    var length = array.length;
    if (was_empty && length === 0) {
      return;
    }
    was_empty = length === 0;
    {
      reconcile(array, state2, anchor, render_fn, flags, get_key);
    }
    if (fallback_fn !== null) {
      if (length === 0) {
        if (fallback) {
          resume_effect(fallback);
        } else {
          fallback = branch(() => fallback_fn(anchor));
        }
      } else if (fallback !== null) {
        pause_effect(fallback, () => {
          fallback = null;
        });
      }
    }
    get_collection();
  });
}
function reconcile(array, state2, anchor, render_fn, flags, get_key) {
  var _a2, _b, _c, _d;
  var is_animated = (flags & EACH_IS_ANIMATED) !== 0;
  var should_update = (flags & (EACH_ITEM_REACTIVE | EACH_INDEX_REACTIVE)) !== 0;
  var length = array.length;
  var items = state2.items;
  var first = state2.first;
  var current2 = first;
  var seen;
  var prev = null;
  var to_animate;
  var matched = [];
  var stashed = [];
  var value;
  var key;
  var item;
  var i;
  if (is_animated) {
    for (i = 0; i < length; i += 1) {
      value = array[i];
      key = get_key(value, i);
      item = items.get(key);
      if (item !== void 0) {
        (_a2 = item.a) == null ? void 0 : _a2.measure();
        (to_animate ?? (to_animate = /* @__PURE__ */ new Set())).add(item);
      }
    }
  }
  for (i = 0; i < length; i += 1) {
    value = array[i];
    key = get_key(value, i);
    item = items.get(key);
    if (item === void 0) {
      var child_anchor = current2 ? (
        /** @type {TemplateNode} */
        current2.e.nodes_start
      ) : anchor;
      prev = create_item(
        child_anchor,
        state2,
        prev,
        prev === null ? state2.first : prev.next,
        value,
        key,
        i,
        render_fn,
        flags
      );
      items.set(key, prev);
      matched = [];
      stashed = [];
      current2 = prev.next;
      continue;
    }
    if (should_update) {
      update_item(item, value, i, flags);
    }
    if ((item.e.f & INERT) !== 0) {
      resume_effect(item.e);
      if (is_animated) {
        (_b = item.a) == null ? void 0 : _b.unfix();
        (to_animate ?? (to_animate = /* @__PURE__ */ new Set())).delete(item);
      }
    }
    if (item !== current2) {
      if (seen !== void 0 && seen.has(item)) {
        if (matched.length < stashed.length) {
          var start = stashed[0];
          var j;
          prev = start.prev;
          var a2 = matched[0];
          var b2 = matched[matched.length - 1];
          for (j = 0; j < matched.length; j += 1) {
            move(matched[j], start, anchor);
          }
          for (j = 0; j < stashed.length; j += 1) {
            seen.delete(stashed[j]);
          }
          link(state2, a2.prev, b2.next);
          link(state2, prev, a2);
          link(state2, b2, start);
          current2 = start;
          prev = b2;
          i -= 1;
          matched = [];
          stashed = [];
        } else {
          seen.delete(item);
          move(item, current2, anchor);
          link(state2, item.prev, item.next);
          link(state2, item, prev === null ? state2.first : prev.next);
          link(state2, prev, item);
          prev = item;
        }
        continue;
      }
      matched = [];
      stashed = [];
      while (current2 !== null && current2.k !== key) {
        if ((current2.e.f & INERT) === 0) {
          (seen ?? (seen = /* @__PURE__ */ new Set())).add(current2);
        }
        stashed.push(current2);
        current2 = current2.next;
      }
      if (current2 === null) {
        continue;
      }
      item = current2;
    }
    matched.push(item);
    prev = item;
    current2 = item.next;
  }
  if (current2 !== null || seen !== void 0) {
    var to_destroy = seen === void 0 ? [] : array_from(seen);
    while (current2 !== null) {
      if ((current2.e.f & INERT) === 0) {
        to_destroy.push(current2);
      }
      current2 = current2.next;
    }
    var destroy_length = to_destroy.length;
    if (destroy_length > 0) {
      var controlled_anchor = (flags & EACH_IS_CONTROLLED) !== 0 && length === 0 ? anchor : null;
      if (is_animated) {
        for (i = 0; i < destroy_length; i += 1) {
          (_c = to_destroy[i].a) == null ? void 0 : _c.measure();
        }
        for (i = 0; i < destroy_length; i += 1) {
          (_d = to_destroy[i].a) == null ? void 0 : _d.fix();
        }
      }
      pause_effects(state2, to_destroy, controlled_anchor, items);
    }
  }
  if (is_animated) {
    queue_micro_task(() => {
      var _a3;
      if (to_animate === void 0) return;
      for (item of to_animate) {
        (_a3 = item.a) == null ? void 0 : _a3.apply();
      }
    });
  }
  active_effect.first = state2.first && state2.first.e;
  active_effect.last = prev && prev.e;
}
function update_item(item, value, index2, type) {
  if ((type & EACH_ITEM_REACTIVE) !== 0) {
    internal_set(item.v, value);
  }
  if ((type & EACH_INDEX_REACTIVE) !== 0) {
    internal_set(
      /** @type {Value<number>} */
      item.i,
      index2
    );
  } else {
    item.i = index2;
  }
}
function create_item(anchor, state2, prev, next, value, key, index2, render_fn, flags) {
  var previous_each_item = current_each_item;
  try {
    var reactive = (flags & EACH_ITEM_REACTIVE) !== 0;
    var mutable = (flags & EACH_ITEM_IMMUTABLE) === 0;
    var v2 = reactive ? mutable ? /* @__PURE__ */ mutable_source(value) : source(value) : value;
    var i = (flags & EACH_INDEX_REACTIVE) === 0 ? index2 : source(index2);
    var item = {
      i,
      v: v2,
      k: key,
      a: null,
      // @ts-expect-error
      e: null,
      prev,
      next
    };
    current_each_item = item;
    item.e = branch(() => render_fn(anchor, v2, i), hydrating);
    item.e.prev = prev && prev.e;
    item.e.next = next && next.e;
    if (prev === null) {
      state2.first = item;
    } else {
      prev.next = item;
      prev.e.next = item.e;
    }
    if (next !== null) {
      next.prev = item;
      next.e.prev = item.e;
    }
    return item;
  } finally {
    current_each_item = previous_each_item;
  }
}
function move(item, next, anchor) {
  var end = item.next ? (
    /** @type {TemplateNode} */
    item.next.e.nodes_start
  ) : anchor;
  var dest = next ? (
    /** @type {TemplateNode} */
    next.e.nodes_start
  ) : anchor;
  var node = (
    /** @type {TemplateNode} */
    item.e.nodes_start
  );
  while (node !== end) {
    var next_node = (
      /** @type {TemplateNode} */
      /* @__PURE__ */ get_next_sibling(node)
    );
    dest.before(node);
    node = next_node;
  }
}
function link(state2, prev, next) {
  if (prev === null) {
    state2.first = next;
  } else {
    prev.next = next;
    prev.e.next = next && next.e;
  }
  if (next !== null) {
    next.prev = prev;
    next.e.prev = prev && prev.e;
  }
}
function slot(anchor, $$props, name, slot_props, fallback_fn) {
  var _a2;
  var slot_fn = (_a2 = $$props.$$slots) == null ? void 0 : _a2[name];
  var is_interop = false;
  if (slot_fn === true) {
    slot_fn = $$props["children"];
    is_interop = true;
  }
  if (slot_fn === void 0) ;
  else {
    slot_fn(anchor, is_interop ? () => slot_props : slot_props);
  }
}
function element(node, get_tag, is_svg, render_fn, get_namespace, location) {
  var tag;
  var current_tag;
  var element2 = null;
  var anchor = (
    /** @type {TemplateNode} */
    node
  );
  var effect2;
  var each_item_block = current_each_item;
  block(() => {
    const next_tag = get_tag() || null;
    var ns = NAMESPACE_SVG;
    if (next_tag === tag) return;
    var previous_each_item = current_each_item;
    set_current_each_item(each_item_block);
    if (effect2) {
      if (next_tag === null) {
        pause_effect(effect2, () => {
          effect2 = null;
          current_tag = null;
        });
      } else if (next_tag === current_tag) {
        resume_effect(effect2);
      } else {
        destroy_effect(effect2);
      }
    }
    if (next_tag && next_tag !== current_tag) {
      effect2 = branch(() => {
        element2 = document.createElementNS(ns, next_tag);
        assign_nodes(element2, element2);
        if (render_fn) {
          var child_anchor = (
            /** @type {TemplateNode} */
            element2.appendChild(create_text())
          );
          render_fn(element2, child_anchor);
        }
        active_effect.nodes_end = element2;
        anchor.before(element2);
      });
    }
    tag = next_tag;
    if (tag) current_tag = tag;
    set_current_each_item(previous_each_item);
  }, EFFECT_TRANSPARENT);
}
function autofocus(dom2, value) {
  if (value) {
    const body = document.body;
    dom2.autofocus = true;
    queue_micro_task(() => {
      if (document.activeElement === body) {
        dom2.focus();
      }
    });
  }
}
let listening_to_form_reset = false;
function add_form_reset_listener() {
  if (!listening_to_form_reset) {
    listening_to_form_reset = true;
    document.addEventListener(
      "reset",
      (evt) => {
        Promise.resolve().then(() => {
          var _a2;
          if (!evt.defaultPrevented) {
            for (
              const e2 of
              /**@type {HTMLFormElement} */
              evt.target.elements
            ) {
              (_a2 = e2.__on_r) == null ? void 0 : _a2.call(e2);
            }
          }
        });
      },
      // In the capture phase to guarantee we get noticed of it (no possiblity of stopPropagation)
      { capture: true }
    );
  }
}
function set_value(element2, value) {
  var attributes = element2.__attributes ?? (element2.__attributes = {});
  if (attributes.value === (attributes.value = value) || // @ts-expect-error
  // `progress` elements always need their value set when its `0`
  element2.value === value && (value !== 0 || element2.nodeName !== "PROGRESS"))
    return;
  element2.value = value;
}
function set_attribute(element2, attribute, value, skip_warning) {
  var attributes = element2.__attributes ?? (element2.__attributes = {});
  if (attributes[attribute] === (attributes[attribute] = value)) return;
  if (attribute === "style" && "__styles" in element2) {
    element2.__styles = {};
  }
  if (attribute === "loading") {
    element2[LOADING_ATTR_SYMBOL] = value;
  }
  if (value == null) {
    element2.removeAttribute(attribute);
  } else if (typeof value !== "string" && get_setters(element2).includes(attribute)) {
    element2[attribute] = value;
  } else {
    element2.setAttribute(attribute, value);
  }
}
function set_attributes(element2, prev, next, css_hash, preserve_attribute_case = false, is_custom_element = false, skip_warning = false) {
  var current2 = prev || {};
  var is_option_element = element2.tagName === "OPTION";
  for (var key in prev) {
    if (!(key in next)) {
      next[key] = null;
    }
  }
  var setters = get_setters(element2);
  var attributes = (
    /** @type {Record<string, unknown>} **/
    element2.__attributes ?? (element2.__attributes = {})
  );
  var events = [];
  for (const key2 in next) {
    let value = next[key2];
    if (is_option_element && key2 === "value" && value == null) {
      element2.value = element2.__value = "";
      current2[key2] = value;
      continue;
    }
    var prev_value = current2[key2];
    if (value === prev_value) continue;
    current2[key2] = value;
    var prefix = key2[0] + key2[1];
    if (prefix === "$$") continue;
    if (prefix === "on") {
      const opts = {};
      const event_handle_key = "$$" + key2;
      let event_name = key2.slice(2);
      var delegated = is_delegated(event_name);
      if (is_capture_event(event_name)) {
        event_name = event_name.slice(0, -7);
        opts.capture = true;
      }
      if (!delegated && prev_value) {
        if (value != null) continue;
        element2.removeEventListener(event_name, current2[event_handle_key], opts);
        current2[event_handle_key] = null;
      }
      if (value != null) {
        if (!delegated) {
          let handle = function(evt) {
            current2[key2].call(this, evt);
          };
          if (!prev) {
            events.push([
              key2,
              value,
              () => current2[event_handle_key] = create_event(event_name, element2, handle, opts)
            ]);
          } else {
            current2[event_handle_key] = create_event(event_name, element2, handle, opts);
          }
        } else {
          element2[`__${event_name}`] = value;
          delegate([event_name]);
        }
      }
    } else if (key2 === "style" && value != null) {
      element2.style.cssText = value + "";
    } else if (key2 === "autofocus") {
      autofocus(
        /** @type {HTMLElement} */
        element2,
        Boolean(value)
      );
    } else if (key2 === "__value" || key2 === "value" && value != null) {
      element2.value = element2[key2] = element2.__value = value;
    } else {
      var name = key2;
      if (!preserve_attribute_case) {
        name = normalize_attribute(name);
      }
      if (value == null && !is_custom_element) {
        attributes[key2] = null;
        element2.removeAttribute(key2);
      } else if (setters.includes(name) && (is_custom_element || typeof value !== "string")) {
        element2[name] = value;
      } else if (typeof value !== "function") {
        {
          set_attribute(element2, name, value);
        }
      }
    }
    if (key2 === "style" && "__styles" in element2) {
      element2.__styles = {};
    }
  }
  if (!prev) {
    queue_micro_task(() => {
      if (!element2.isConnected) return;
      for (const [key2, value, evt] of events) {
        if (current2[key2] === value) {
          evt();
        }
      }
    });
  }
  return current2;
}
var setters_cache = /* @__PURE__ */ new Map();
function get_setters(element2) {
  var setters = setters_cache.get(element2.nodeName);
  if (setters) return setters;
  setters_cache.set(element2.nodeName, setters = []);
  var descriptors;
  var proto = get_prototype_of(element2);
  var element_proto = Element.prototype;
  while (element_proto !== proto) {
    descriptors = get_descriptors(proto);
    for (var key in descriptors) {
      if (descriptors[key].set) {
        setters.push(key);
      }
    }
    proto = get_prototype_of(proto);
  }
  return setters;
}
const request_animation_frame = requestAnimationFrame;
const now = () => performance.now();
const raf = {
  tick: (
    /** @param {any} _ */
    (_) => request_animation_frame(_)
  ),
  now: () => now(),
  tasks: /* @__PURE__ */ new Set()
};
function run_tasks(now2) {
  raf.tasks.forEach((task) => {
    if (!task.c(now2)) {
      raf.tasks.delete(task);
      task.f();
    }
  });
  if (raf.tasks.size !== 0) {
    raf.tick(run_tasks);
  }
}
function loop(callback) {
  let task;
  if (raf.tasks.size === 0) {
    raf.tick(run_tasks);
  }
  return {
    promise: new Promise((fulfill) => {
      raf.tasks.add(task = { c: callback, f: fulfill });
    }),
    abort() {
      raf.tasks.delete(task);
    }
  };
}
function listen_to_event_and_reset_event(element2, event, handler, on_reset = handler) {
  element2.addEventListener(event, handler);
  const prev = element2.__on_r;
  if (prev) {
    element2.__on_r = () => {
      prev();
      on_reset();
    };
  } else {
    element2.__on_r = on_reset;
  }
  add_form_reset_listener();
}
function select_option(select, value, mounting) {
  if (select.multiple) {
    return select_options(select, value);
  }
  for (var option of select.options) {
    var option_value = get_option_value(option);
    if (is(option_value, value)) {
      option.selected = true;
      return;
    }
  }
  if (!mounting || value !== void 0) {
    select.selectedIndex = -1;
  }
}
function init_select(select, get_value) {
  effect(() => {
    var observer = new MutationObserver(() => {
      var value = select.__value;
      select_option(select, value);
    });
    observer.observe(select, {
      // Listen to option element changes
      childList: true,
      subtree: true,
      // because of <optgroup>
      // Listen to option element value attribute changes
      // (doesn't get notified of select value changes,
      // because that property is not reflected as an attribute)
      attributes: true,
      attributeFilter: ["value"]
    });
    return () => {
      observer.disconnect();
    };
  });
}
function bind_select_value(select, get11, set2 = get11) {
  var mounting = true;
  listen_to_event_and_reset_event(select, "change", () => {
    var value;
    if (select.multiple) {
      value = [].map.call(select.querySelectorAll(":checked"), get_option_value);
    } else {
      var selected_option = select.querySelector(":checked");
      value = selected_option && get_option_value(selected_option);
    }
    set2(value);
  });
  effect(() => {
    var value = get11();
    select_option(select, value, mounting);
    if (mounting && value === void 0) {
      var selected_option = select.querySelector(":checked");
      if (selected_option !== null) {
        value = get_option_value(selected_option);
        set2(value);
      }
    }
    select.__value = value;
    mounting = false;
  });
  init_select(select);
}
function select_options(select, value) {
  for (var option of select.options) {
    option.selected = ~value.indexOf(get_option_value(option));
  }
}
function get_option_value(option) {
  if ("__value" in option) {
    return option.__value;
  } else {
    return option.value;
  }
}
function is_bound_this(bound_value, element_or_component) {
  return bound_value === element_or_component || (bound_value == null ? void 0 : bound_value[STATE_SYMBOL]) === element_or_component;
}
function bind_this(element_or_component = {}, update2, get_value, get_parts) {
  effect(() => {
    var old_parts;
    var parts;
    render_effect(() => {
      old_parts = parts;
      parts = [];
      untrack(() => {
        if (element_or_component !== get_value(...parts)) {
          update2(element_or_component, ...parts);
          if (old_parts && is_bound_this(get_value(...old_parts), element_or_component)) {
            update2(null, ...old_parts);
          }
        }
      });
    });
    return () => {
      queue_micro_task(() => {
        if (parts && is_bound_this(get_value(...parts), element_or_component)) {
          update2(null, ...parts);
        }
      });
    };
  });
  return element_or_component;
}
function init(immutable = false) {
  const context = (
    /** @type {ComponentContextLegacy} */
    component_context
  );
  const callbacks = context.l.u;
  if (!callbacks) return;
  let props = () => deep_read_state(context.s);
  if (immutable) {
    let version2 = 0;
    let prev = (
      /** @type {Record<string, any>} */
      {}
    );
    const d2 = /* @__PURE__ */ derived(() => {
      let changed = false;
      const props2 = context.s;
      for (const key in props2) {
        if (props2[key] !== prev[key]) {
          prev[key] = props2[key];
          changed = true;
        }
      }
      if (changed) version2++;
      return version2;
    });
    props = () => get10(d2);
  }
  if (callbacks.b.length) {
    user_pre_effect(() => {
      observe_all(context, props);
      run_all(callbacks.b);
    });
  }
  user_effect(() => {
    const fns = untrack(() => callbacks.m.map(run));
    return () => {
      for (const fn of fns) {
        if (typeof fn === "function") {
          fn();
        }
      }
    };
  });
  if (callbacks.a.length) {
    user_effect(() => {
      observe_all(context, props);
      run_all(callbacks.a);
    });
  }
}
function observe_all(context, props) {
  if (context.l.s) {
    for (const signal of context.l.s) get10(signal);
  }
  props();
}
function subscribe_to_store(store, run2, invalidate) {
  if (store == null) {
    run2(void 0);
    return noop;
  }
  const unsub = untrack(
    () => store.subscribe(
      run2,
      // @ts-expect-error
      invalidate
    )
  );
  return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
let is_store_binding = false;
function store_get(store, store_name, stores) {
  const entry = stores[store_name] ?? (stores[store_name] = {
    store: null,
    source: /* @__PURE__ */ mutable_source(void 0),
    unsubscribe: noop
  });
  if (entry.store !== store) {
    entry.unsubscribe();
    entry.store = store ?? null;
    if (store == null) {
      entry.source.v = void 0;
      entry.unsubscribe = noop;
    } else {
      var is_synchronous_callback = true;
      entry.unsubscribe = subscribe_to_store(store, (v2) => {
        if (is_synchronous_callback) {
          entry.source.v = v2;
        } else {
          set(entry.source, v2);
        }
      });
      is_synchronous_callback = false;
    }
  }
  return get10(entry.source);
}
function setup_stores() {
  const stores = {};
  teardown(() => {
    for (var store_name in stores) {
      const ref2 = stores[store_name];
      ref2.unsubscribe();
    }
  });
  return stores;
}
function capture_store_binding(fn) {
  var previous_is_store_binding = is_store_binding;
  try {
    is_store_binding = false;
    return [fn(), is_store_binding];
  } finally {
    is_store_binding = previous_is_store_binding;
  }
}
const legacy_rest_props_handler = {
  get(target, key) {
    if (target.exclude.includes(key)) return;
    get10(target.version);
    return key in target.special ? target.special[key]() : target.props[key];
  },
  set(target, key, value) {
    if (!(key in target.special)) {
      target.special[key] = prop(
        {
          get [key]() {
            return target.props[key];
          }
        },
        /** @type {string} */
        key,
        PROPS_IS_UPDATED
      );
    }
    target.special[key](value);
    update(target.version);
    return true;
  },
  getOwnPropertyDescriptor(target, key) {
    if (target.exclude.includes(key)) return;
    if (key in target.props) {
      return {
        enumerable: true,
        configurable: true,
        value: target.props[key]
      };
    }
  },
  deleteProperty(target, key) {
    if (target.exclude.includes(key)) return true;
    target.exclude.push(key);
    update(target.version);
    return true;
  },
  has(target, key) {
    if (target.exclude.includes(key)) return false;
    return key in target.props;
  },
  ownKeys(target) {
    return Reflect.ownKeys(target.props).filter((key) => !target.exclude.includes(key));
  }
};
function legacy_rest_props(props, exclude) {
  return new Proxy({ props, exclude, special: {}, version: source(0) }, legacy_rest_props_handler);
}
const spread_props_handler = {
  get(target, key) {
    let i = target.props.length;
    while (i--) {
      let p2 = target.props[i];
      if (is_function(p2)) p2 = p2();
      if (typeof p2 === "object" && p2 !== null && key in p2) return p2[key];
    }
  },
  set(target, key, value) {
    let i = target.props.length;
    while (i--) {
      let p2 = target.props[i];
      if (is_function(p2)) p2 = p2();
      const desc = get_descriptor(p2, key);
      if (desc && desc.set) {
        desc.set(value);
        return true;
      }
    }
    return false;
  },
  getOwnPropertyDescriptor(target, key) {
    let i = target.props.length;
    while (i--) {
      let p2 = target.props[i];
      if (is_function(p2)) p2 = p2();
      if (typeof p2 === "object" && p2 !== null && key in p2) {
        const descriptor = get_descriptor(p2, key);
        if (descriptor && !descriptor.configurable) {
          descriptor.configurable = true;
        }
        return descriptor;
      }
    }
  },
  has(target, key) {
    for (let p2 of target.props) {
      if (is_function(p2)) p2 = p2();
      if (p2 != null && key in p2) return true;
    }
    return false;
  },
  ownKeys(target) {
    const keys11 = [];
    for (let p2 of target.props) {
      if (is_function(p2)) p2 = p2();
      for (const key in p2) {
        if (!keys11.includes(key)) keys11.push(key);
      }
    }
    return keys11;
  }
};
function spread_props(...props) {
  return new Proxy({ props }, spread_props_handler);
}
function with_parent_branch(fn) {
  var effect2 = active_effect;
  var previous_effect = active_effect;
  while (effect2 !== null && (effect2.f & (BRANCH_EFFECT | ROOT_EFFECT)) === 0) {
    effect2 = effect2.parent;
  }
  try {
    set_active_effect(effect2);
    return fn();
  } finally {
    set_active_effect(previous_effect);
  }
}
function prop(props, key, flags, fallback) {
  var _a2;
  var immutable = (flags & PROPS_IS_IMMUTABLE) !== 0;
  var runes = (flags & PROPS_IS_RUNES) !== 0;
  var bindable = (flags & PROPS_IS_BINDABLE) !== 0;
  var lazy = (flags & PROPS_IS_LAZY_INITIAL) !== 0;
  var is_store_sub = false;
  var prop_value;
  if (bindable) {
    [prop_value, is_store_sub] = capture_store_binding(() => (
      /** @type {V} */
      props[key]
    ));
  } else {
    prop_value = /** @type {V} */
    props[key];
  }
  var setter = (_a2 = get_descriptor(props, key)) == null ? void 0 : _a2.set;
  var fallback_value = (
    /** @type {V} */
    fallback
  );
  var fallback_dirty = true;
  var fallback_used = false;
  var get_fallback = () => {
    fallback_used = true;
    if (fallback_dirty) {
      fallback_dirty = false;
      if (lazy) {
        fallback_value = untrack(
          /** @type {() => V} */
          fallback
        );
      } else {
        fallback_value = /** @type {V} */
        fallback;
      }
    }
    return fallback_value;
  };
  if (prop_value === void 0 && fallback !== void 0) {
    if (setter && runes) {
      props_invalid_value();
    }
    prop_value = get_fallback();
    if (setter) setter(prop_value);
  }
  var getter;
  if (runes) {
    getter = () => {
      var value = (
        /** @type {V} */
        props[key]
      );
      if (value === void 0) return get_fallback();
      fallback_dirty = true;
      fallback_used = false;
      return value;
    };
  } else {
    var derived_getter = with_parent_branch(
      () => (immutable ? derived : derived_safe_equal)(() => (
        /** @type {V} */
        props[key]
      ))
    );
    derived_getter.f |= LEGACY_DERIVED_PROP;
    getter = () => {
      var value = get10(derived_getter);
      if (value !== void 0) fallback_value = /** @type {V} */
      void 0;
      return value === void 0 ? fallback_value : value;
    };
  }
  if ((flags & PROPS_IS_UPDATED) === 0) {
    return getter;
  }
  if (setter) {
    var legacy_parent = props.$$legacy;
    return function(value, mutation) {
      if (arguments.length > 0) {
        if (!runes || !mutation || legacy_parent || is_store_sub) {
          setter(mutation ? getter() : value);
        }
        return value;
      } else {
        return getter();
      }
    };
  }
  var from_child = false;
  var was_from_child = false;
  var inner_current_value = /* @__PURE__ */ mutable_source(prop_value);
  var current_value = with_parent_branch(
    () => /* @__PURE__ */ derived(() => {
      var parent_value = getter();
      var child_value = get10(inner_current_value);
      var current_derived = (
        /** @type {Derived} */
        active_reaction
      );
      if (from_child || parent_value === void 0 && (current_derived.f & DESTROYED) !== 0) {
        from_child = false;
        was_from_child = true;
        return child_value;
      }
      was_from_child = false;
      return inner_current_value.v = parent_value;
    })
  );
  if (!immutable) current_value.equals = safe_equals;
  return function(value, mutation) {
    if (arguments.length > 0) {
      const new_value = mutation ? get10(current_value) : runes && bindable ? proxy(value) : value;
      if (!current_value.equals(new_value)) {
        from_child = true;
        set(inner_current_value, new_value);
        if (fallback_used && fallback_value !== void 0) {
          fallback_value = new_value;
        }
        untrack(() => get10(current_value));
      }
      return value;
    }
    return get10(current_value);
  };
}
var root_1$4 = /* @__PURE__ */ ns_template(`<title> </title>`);
var root$7 = /* @__PURE__ */ ns_template(`<svg><!><path d="M30 23H24a2 2 0 01-2-2V11a2 2 0 012-2h6v2H24V21h4V17H26V15h4zM18 19L14.32 9 12 9 12 23 14 23 14 13 17.68 23 20 23 20 9 18 9 18 19zM4 23H2V9H8a2 2 0 012 2v5a2 2 0 01-2 2H4zm0-7H8V11H4z"></path></svg>`);
function Png($$anchor, $$props) {
  const $$sanitized_props = legacy_rest_props($$props, [
    "children",
    "$$slots",
    "$$events",
    "$$legacy"
  ]);
  const $$restProps = legacy_rest_props($$sanitized_props, ["size", "title"]);
  push($$props, false);
  const labelled = mutable_state();
  const attributes = mutable_state();
  let size = prop($$props, "size", 8, 16);
  let title = prop($$props, "title", 8, void 0);
  legacy_pre_effect(
    () => (deep_read_state($$sanitized_props), deep_read_state(title())),
    () => {
      set(labelled, $$sanitized_props["aria-label"] || $$sanitized_props["aria-labelledby"] || title());
    }
  );
  legacy_pre_effect(
    () => (get10(labelled), deep_read_state($$sanitized_props)),
    () => {
      set(attributes, {
        "aria-hidden": get10(labelled) ? void 0 : true,
        role: get10(labelled) ? "img" : void 0,
        focusable: Number($$sanitized_props["tabindex"]) === 0 ? true : void 0
      });
    }
  );
  legacy_pre_effect_reset();
  init();
  var svg = root$7();
  let attributes_1;
  var node = child(svg);
  if_block(node, title, ($$anchor2) => {
    var title_1 = root_1$4();
    var text2 = child(title_1);
    template_effect(() => set_text(text2, title()));
    append($$anchor2, title_1);
  });
  template_effect(() => attributes_1 = set_attributes(
    svg,
    attributes_1,
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 32 32",
      fill: "currentColor",
      preserveAspectRatio: "xMidYMid meet",
      width: size(),
      height: size(),
      ...get10(attributes),
      ...$$restProps
    },
    void 0,
    true
  ));
  append($$anchor, svg);
  pop();
}
var root_1$3 = /* @__PURE__ */ ns_template(`<title> </title>`);
var root$6 = /* @__PURE__ */ ns_template(`<svg><!><path d="M30 23H24a2 2 0 01-2-2V11a2 2 0 012-2h6v2H24V21h4V17H26V15h4zM18 9L16 22 14 9 12 9 14.52 23 17.48 23 20 9 18 9zM8 23H2V21H8V17H4a2 2 0 01-2-2V11A2 2 0 014 9h6v2H4v4H8a2 2 0 012 2v4A2 2 0 018 23z"></path></svg>`);
function Svg($$anchor, $$props) {
  const $$sanitized_props = legacy_rest_props($$props, [
    "children",
    "$$slots",
    "$$events",
    "$$legacy"
  ]);
  const $$restProps = legacy_rest_props($$sanitized_props, ["size", "title"]);
  push($$props, false);
  const labelled = mutable_state();
  const attributes = mutable_state();
  let size = prop($$props, "size", 8, 16);
  let title = prop($$props, "title", 8, void 0);
  legacy_pre_effect(
    () => (deep_read_state($$sanitized_props), deep_read_state(title())),
    () => {
      set(labelled, $$sanitized_props["aria-label"] || $$sanitized_props["aria-labelledby"] || title());
    }
  );
  legacy_pre_effect(
    () => (get10(labelled), deep_read_state($$sanitized_props)),
    () => {
      set(attributes, {
        "aria-hidden": get10(labelled) ? void 0 : true,
        role: get10(labelled) ? "img" : void 0,
        focusable: Number($$sanitized_props["tabindex"]) === 0 ? true : void 0
      });
    }
  );
  legacy_pre_effect_reset();
  init();
  var svg = root$6();
  let attributes_1;
  var node = child(svg);
  if_block(node, title, ($$anchor2) => {
    var title_1 = root_1$3();
    var text2 = child(title_1);
    template_effect(() => set_text(text2, title()));
    append($$anchor2, title_1);
  });
  template_effect(() => attributes_1 = set_attributes(
    svg,
    attributes_1,
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 32 32",
      fill: "currentColor",
      preserveAspectRatio: "xMidYMid meet",
      width: size(),
      height: size(),
      ...get10(attributes),
      ...$$restProps
    },
    void 0,
    true
  ));
  append($$anchor, svg);
  pop();
}
var root_1$2 = /* @__PURE__ */ ns_template(`<title> </title>`);
var root$5 = /* @__PURE__ */ ns_template(`<svg><!><path d="M30.94,15.66A16.69,16.69,0,0,0,16,5,16.69,16.69,0,0,0,1.06,15.66a1,1,0,0,0,0,.68A16.69,16.69,0,0,0,16,27,16.69,16.69,0,0,0,30.94,16.34,1,1,0,0,0,30.94,15.66ZM16,25c-5.3,0-10.9-3.93-12.93-9C5.1,10.93,10.7,7,16,7s10.9,3.93,12.93,9C26.9,21.07,21.3,25,16,25Z"></path><path d="M16,10a6,6,0,1,0,6,6A6,6,0,0,0,16,10Zm0,10a4,4,0,1,1,4-4A4,4,0,0,1,16,20Z"></path></svg>`);
function View($$anchor, $$props) {
  const $$sanitized_props = legacy_rest_props($$props, [
    "children",
    "$$slots",
    "$$events",
    "$$legacy"
  ]);
  const $$restProps = legacy_rest_props($$sanitized_props, ["size", "title"]);
  push($$props, false);
  const labelled = mutable_state();
  const attributes = mutable_state();
  let size = prop($$props, "size", 8, 16);
  let title = prop($$props, "title", 8, void 0);
  legacy_pre_effect(
    () => (deep_read_state($$sanitized_props), deep_read_state(title())),
    () => {
      set(labelled, $$sanitized_props["aria-label"] || $$sanitized_props["aria-labelledby"] || title());
    }
  );
  legacy_pre_effect(
    () => (get10(labelled), deep_read_state($$sanitized_props)),
    () => {
      set(attributes, {
        "aria-hidden": get10(labelled) ? void 0 : true,
        role: get10(labelled) ? "img" : void 0,
        focusable: Number($$sanitized_props["tabindex"]) === 0 ? true : void 0
      });
    }
  );
  legacy_pre_effect_reset();
  init();
  var svg = root$5();
  let attributes_1;
  var node = child(svg);
  if_block(node, title, ($$anchor2) => {
    var title_1 = root_1$2();
    var text2 = child(title_1);
    template_effect(() => set_text(text2, title()));
    append($$anchor2, title_1);
  });
  template_effect(() => attributes_1 = set_attributes(
    svg,
    attributes_1,
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 32 32",
      fill: "currentColor",
      preserveAspectRatio: "xMidYMid meet",
      width: size(),
      height: size(),
      ...get10(attributes),
      ...$$restProps
    },
    void 0,
    true
  ));
  append($$anchor, svg);
  pop();
}
var root_1$1 = /* @__PURE__ */ ns_template(`<title> </title>`);
var root$4 = /* @__PURE__ */ ns_template(`<svg><!><path d="M30 25L28.586 23.586 26 26.172 26 18 24 18 24 26.172 21.414 23.586 20 25 25 30 30 25z"></path><path d="M18,28H8V4h8v6a2.0058,2.0058,0,0,0,2,2h6v3l2,0V10a.9092.9092,0,0,0-.3-.7l-7-7A.9087.9087,0,0,0,18,2H8A2.0058,2.0058,0,0,0,6,4V28a2.0058,2.0058,0,0,0,2,2H18ZM18,4.4,23.6,10H18Z"></path></svg>`);
function DocumentDownload($$anchor, $$props) {
  const $$sanitized_props = legacy_rest_props($$props, [
    "children",
    "$$slots",
    "$$events",
    "$$legacy"
  ]);
  const $$restProps = legacy_rest_props($$sanitized_props, ["size", "title"]);
  push($$props, false);
  const labelled = mutable_state();
  const attributes = mutable_state();
  let size = prop($$props, "size", 8, 16);
  let title = prop($$props, "title", 8, void 0);
  legacy_pre_effect(
    () => (deep_read_state($$sanitized_props), deep_read_state(title())),
    () => {
      set(labelled, $$sanitized_props["aria-label"] || $$sanitized_props["aria-labelledby"] || title());
    }
  );
  legacy_pre_effect(
    () => (get10(labelled), deep_read_state($$sanitized_props)),
    () => {
      set(attributes, {
        "aria-hidden": get10(labelled) ? void 0 : true,
        role: get10(labelled) ? "img" : void 0,
        focusable: Number($$sanitized_props["tabindex"]) === 0 ? true : void 0
      });
    }
  );
  legacy_pre_effect_reset();
  init();
  var svg = root$4();
  let attributes_1;
  var node = child(svg);
  if_block(node, title, ($$anchor2) => {
    var title_1 = root_1$1();
    var text2 = child(title_1);
    template_effect(() => set_text(text2, title()));
    append($$anchor2, title_1);
  });
  template_effect(() => attributes_1 = set_attributes(
    svg,
    attributes_1,
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 32 32",
      fill: "currentColor",
      preserveAspectRatio: "xMidYMid meet",
      width: size(),
      height: size(),
      ...get10(attributes),
      ...$$restProps
    },
    void 0,
    true
  ));
  append($$anchor, svg);
  pop();
}
/**
 * @license lucide-svelte v0.454.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const defaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": 2,
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
};
var root$3 = /* @__PURE__ */ ns_template(`<svg><!><!></svg>`);
function Icon($$anchor, $$props) {
  const $$sanitized_props = legacy_rest_props($$props, [
    "children",
    "$$slots",
    "$$events",
    "$$legacy"
  ]);
  const $$restProps = legacy_rest_props($$sanitized_props, [
    "name",
    "color",
    "size",
    "strokeWidth",
    "absoluteStrokeWidth",
    "iconNode"
  ]);
  push($$props, false);
  let name = prop($$props, "name", 8, void 0);
  let color = prop($$props, "color", 8, "currentColor");
  let size = prop($$props, "size", 8, 24);
  let strokeWidth = prop($$props, "strokeWidth", 8, 2);
  let absoluteStrokeWidth = prop($$props, "absoluteStrokeWidth", 8, false);
  let iconNode = prop($$props, "iconNode", 24, () => []);
  const mergeClasses = (...classes) => classes.filter((className, index2, array) => {
    return Boolean(className) && array.indexOf(className) === index2;
  }).join(" ");
  init();
  var svg = root$3();
  let attributes;
  var node = child(svg);
  each(node, 1, iconNode, index, ($$anchor2, $$item) => {
    let tag = () => get10($$item)[0];
    let attrs = () => get10($$item)[1];
    var fragment = comment();
    var node_1 = first_child(fragment);
    element(node_1, tag, true, ($$element, $$anchor3) => {
      let attributes_1;
      template_effect(() => attributes_1 = set_attributes($$element, attributes_1, { ...attrs() }, void 0, $$element.namespaceURI === NAMESPACE_SVG, $$element.nodeName.includes("-")));
    });
    append($$anchor2, fragment);
  });
  var node_2 = sibling2(node);
  slot(node_2, $$props, "default", {});
  template_effect(() => attributes = set_attributes(
    svg,
    attributes,
    {
      ...defaultAttributes,
      ...$$restProps,
      width: size(),
      height: size(),
      stroke: color(),
      "stroke-width": absoluteStrokeWidth() ? Number(strokeWidth()) * 24 / Number(size()) : strokeWidth(),
      class: mergeClasses("lucide-icon", "lucide", name() ? `lucide-${name()}` : "", $$sanitized_props.class)
    },
    void 0,
    true
  ));
  append($$anchor, svg);
  pop();
}
function Circle_x($$anchor, $$props) {
  const $$sanitized_props = legacy_rest_props($$props, [
    "children",
    "$$slots",
    "$$events",
    "$$legacy"
  ]);
  const iconNode = [
    [
      "circle",
      { "cx": "12", "cy": "12", "r": "10" }
    ],
    ["path", { "d": "m15 9-6 6" }],
    ["path", { "d": "m9 9 6 6" }]
  ];
  Icon($$anchor, spread_props({ name: "circle-x" }, () => $$sanitized_props, {
    iconNode,
    children: ($$anchor2, $$slotProps) => {
      var fragment_1 = comment();
      var node = first_child(fragment_1);
      slot(node, $$props, "default", {});
      append($$anchor2, fragment_1);
    },
    $$slots: { default: true }
  }));
}
function Download($$anchor, $$props) {
  const $$sanitized_props = legacy_rest_props($$props, [
    "children",
    "$$slots",
    "$$events",
    "$$legacy"
  ]);
  const iconNode = [
    [
      "path",
      {
        "d": "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
      }
    ],
    [
      "polyline",
      { "points": "7 10 12 15 17 10" }
    ],
    [
      "line",
      {
        "x1": "12",
        "x2": "12",
        "y1": "15",
        "y2": "3"
      }
    ]
  ];
  Icon($$anchor, spread_props({ name: "download" }, () => $$sanitized_props, {
    iconNode,
    children: ($$anchor2, $$slotProps) => {
      var fragment_1 = comment();
      var node = first_child(fragment_1);
      slot(node, $$props, "default", {});
      append($$anchor2, fragment_1);
    },
    $$slots: { default: true }
  }));
}
function Info($$anchor, $$props) {
  const $$sanitized_props = legacy_rest_props($$props, [
    "children",
    "$$slots",
    "$$events",
    "$$legacy"
  ]);
  const iconNode = [
    [
      "circle",
      { "cx": "12", "cy": "12", "r": "10" }
    ],
    ["path", { "d": "M12 16v-4" }],
    ["path", { "d": "M12 8h.01" }]
  ];
  Icon($$anchor, spread_props({ name: "info" }, () => $$sanitized_props, {
    iconNode,
    children: ($$anchor2, $$slotProps) => {
      var fragment_1 = comment();
      var node = first_child(fragment_1);
      slot(node, $$props, "default", {});
      append($$anchor2, fragment_1);
    },
    $$slots: { default: true }
  }));
}
function Refresh_cw($$anchor, $$props) {
  const $$sanitized_props = legacy_rest_props($$props, [
    "children",
    "$$slots",
    "$$events",
    "$$legacy"
  ]);
  const iconNode = [
    [
      "path",
      {
        "d": "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"
      }
    ],
    ["path", { "d": "M21 3v5h-5" }],
    [
      "path",
      {
        "d": "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"
      }
    ],
    ["path", { "d": "M8 16H3v5" }]
  ];
  Icon($$anchor, spread_props({ name: "refresh-cw" }, () => $$sanitized_props, {
    iconNode,
    children: ($$anchor2, $$slotProps) => {
      var fragment_1 = comment();
      var node = first_child(fragment_1);
      slot(node, $$props, "default", {});
      append($$anchor2, fragment_1);
    },
    $$slots: { default: true }
  }));
}
function Settings($$anchor, $$props) {
  const $$sanitized_props = legacy_rest_props($$props, [
    "children",
    "$$slots",
    "$$events",
    "$$legacy"
  ]);
  const iconNode = [
    [
      "path",
      {
        "d": "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
      }
    ],
    [
      "circle",
      { "cx": "12", "cy": "12", "r": "3" }
    ]
  ];
  Icon($$anchor, spread_props({ name: "settings" }, () => $$sanitized_props, {
    iconNode,
    children: ($$anchor2, $$slotProps) => {
      var fragment_1 = comment();
      var node = first_child(fragment_1);
      slot(node, $$props, "default", {});
      append($$anchor2, fragment_1);
    },
    $$slots: { default: true }
  }));
}
const subscriber_queue = [];
function writable(value, start = noop) {
  let stop = null;
  const subscribers = /* @__PURE__ */ new Set();
  function set2(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (const subscriber of subscribers) {
          subscriber[1]();
          subscriber_queue.push(subscriber, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update2(fn) {
    set2(fn(
      /** @type {T} */
      value
    ));
  }
  function subscribe(run2, invalidate = noop) {
    const subscriber = [run2, invalidate];
    subscribers.add(subscriber);
    if (subscribers.size === 1) {
      stop = start(set2, update2) || noop;
    }
    run2(
      /** @type {T} */
      value
    );
    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0 && stop) {
        stop();
        stop = null;
      }
    };
  }
  return { set: set2, update: update2, subscribe };
}
function is_date(obj) {
  return Object.prototype.toString.call(obj) === "[object Date]";
}
function linear(t2) {
  return t2;
}
function cubicOut(t2) {
  const f2 = t2 - 1;
  return f2 * f2 * f2 + 1;
}
function get_interpolator(a2, b2) {
  if (a2 === b2 || a2 !== a2) return () => a2;
  const type = typeof a2;
  if (type !== typeof b2 || Array.isArray(a2) !== Array.isArray(b2)) {
    throw new Error("Cannot interpolate values of different type");
  }
  if (Array.isArray(a2)) {
    const arr = (
      /** @type {Array<any>} */
      b2.map((bi, i) => {
        return get_interpolator(
          /** @type {Array<any>} */
          a2[i],
          bi
        );
      })
    );
    return (t2) => arr.map((fn) => fn(t2));
  }
  if (type === "object") {
    if (!a2 || !b2) {
      throw new Error("Object cannot be null");
    }
    if (is_date(a2) && is_date(b2)) {
      const an = a2.getTime();
      const bn = b2.getTime();
      const delta = bn - an;
      return (t2) => new Date(an + t2 * delta);
    }
    const keys11 = Object.keys(b2);
    const interpolators = {};
    keys11.forEach((key) => {
      interpolators[key] = get_interpolator(a2[key], b2[key]);
    });
    return (t2) => {
      const result = {};
      keys11.forEach((key) => {
        result[key] = interpolators[key](t2);
      });
      return result;
    };
  }
  if (type === "number") {
    const delta = (
      /** @type {number} */
      b2 - /** @type {number} */
      a2
    );
    return (t2) => a2 + t2 * delta;
  }
  throw new Error(`Cannot interpolate ${type} values`);
}
function tweened(value, defaults = {}) {
  const store = writable(value);
  let task;
  let target_value = value;
  function set2(new_value, opts) {
    target_value = new_value;
    if (value == null) {
      store.set(value = new_value);
      return Promise.resolve();
    }
    let previous_task = task;
    let started = false;
    let {
      delay = 0,
      duration = 400,
      easing = linear,
      interpolate = get_interpolator
    } = { ...defaults, ...opts };
    if (duration === 0) {
      if (previous_task) {
        previous_task.abort();
        previous_task = null;
      }
      store.set(value = target_value);
      return Promise.resolve();
    }
    const start = raf.now() + delay;
    let fn;
    task = loop((now2) => {
      if (now2 < start) return true;
      if (!started) {
        fn = interpolate(
          /** @type {any} */
          value,
          new_value
        );
        if (typeof duration === "function")
          duration = duration(
            /** @type {any} */
            value,
            new_value
          );
        started = true;
      }
      if (previous_task) {
        previous_task.abort();
        previous_task = null;
      }
      const elapsed = now2 - start;
      if (elapsed > /** @type {number} */
      duration) {
        store.set(value = new_value);
        return false;
      }
      store.set(value = fn(easing(elapsed / duration)));
      return true;
    });
    return task.promise;
  }
  return {
    set: set2,
    update: (fn, opts) => set2(fn(
      /** @type {any} */
      target_value,
      /** @type {any} */
      value
    ), opts),
    subscribe: store.subscribe
  };
}
const SELECT_NONE = "none";
const archList = proxy({ value: null });
class Architecture {
  constructor() {
    __privateAdd(this, _info, state(null));
    __privateAdd(this, _artifacts, state(null));
    __privateAdd(this, _instances, state(null));
    __privateAdd(this, _selected, state(SELECT_NONE));
    __privateAdd(this, _elements, state(null));
  }
  get info() {
    return get10(__privateGet(this, _info));
  }
  set info(value) {
    set(__privateGet(this, _info), proxy(value));
  }
  get artifacts() {
    return get10(__privateGet(this, _artifacts));
  }
  set artifacts(value) {
    set(__privateGet(this, _artifacts), proxy(value));
  }
  get instances() {
    return get10(__privateGet(this, _instances));
  }
  set instances(value) {
    set(__privateGet(this, _instances), proxy(value));
  }
  get selected() {
    return get10(__privateGet(this, _selected));
  }
  set selected(value) {
    set(__privateGet(this, _selected), proxy(value));
  }
  get elements() {
    return get10(__privateGet(this, _elements));
  }
  set elements(value) {
    set(__privateGet(this, _elements), proxy(value));
  }
}
_info = new WeakMap();
_artifacts = new WeakMap();
_instances = new WeakMap();
_selected = new WeakMap();
_elements = new WeakMap();
const architecture = new Architecture();
const progress = tweened(0, { duration: 400, easing: cubicOut });
const errorMsgs = proxy({ value: [] });
const ARTIFACT_WITH_DIAGRAM = [
  "assetartifact_systemcontext",
  "assetartifact_usecase_ucdiagram",
  "assetartifact_architectureoverview_aodservice",
  "assetartifact_architectureoverview_enterprise",
  "assetartifact_architectureoverview_itsystem",
  "assetartifact_architectureoverview_usagescenario",
  "assetartifact_componentmodel_staticview",
  "assetartifact_componentmodel_dynamicview",
  "assetartifact_operationalmodel_logicaloperational",
  "assetartifact_operationalmodel_physicaloperational",
  "assetartifact_logical_datamodel"
];
var root_3 = /* @__PURE__ */ template(`<tr><td class="svelte-sl2555"> </td><td class="svelte-sl2555">Admin</td><td class="svelte-sl2555"> </td></tr>`);
var root_4 = /* @__PURE__ */ template(`<tr><td class="svelte-sl2555"> </td><td class="svelte-sl2555">Edit</td><td class="svelte-sl2555"> </td></tr>`);
var root_5$1 = /* @__PURE__ */ template(`<tr><td class="svelte-sl2555"> </td><td class="svelte-sl2555">View</td><td class="svelte-sl2555"> </td></tr>`);
var root_2$2 = /* @__PURE__ */ template(`<table class="svelte-sl2555"><tbody><tr><th class="svelte-sl2555">Property</th><th class="svelte-sl2555">Value</th></tr><tr><td class="svelte-sl2555">Id</td><td class="svelte-sl2555"> </td></tr><tr><td class="svelte-sl2555">Name</td><td class="svelte-sl2555"> </td></tr><tr><td class="svelte-sl2555">Client</td><td class="svelte-sl2555"> </td></tr><tr><td class="svelte-sl2555">Owner</td><td class="svelte-sl2555"></td></tr><tr><td class="svelte-sl2555">Last Modified</td><td class="svelte-sl2555"> </td></tr><tr><td class="svelte-sl2555">Last Modified by</td><td class="svelte-sl2555"> </td></tr></tbody></table> <p></p> <h5>Co-authors</h5> <table class="svelte-sl2555"><thead><tr><th class="svelte-sl2555">Name</th><th class="svelte-sl2555">Rights</th><th class="svelte-sl2555">Job responsibility</th></tr></thead><tbody><!><!><!></tbody></table>`, 1);
var root$2 = /* @__PURE__ */ template(`<h3>Information on architecture</h3> <!>`, 1);
function CAArchInfoModalComponent($$anchor, $$props) {
  var _a2, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o;
  push($$props, true);
  const owner = ((_b = (_a2 = $$props.arch) == null ? void 0 : _a2.owner) == null ? void 0 : _b.fullname) ? (_c = $$props.arch.owner) == null ? void 0 : _c.fullname : "";
  const adminMembers = [];
  if ((_e = (_d = $$props.arch) == null ? void 0 : _d.team) == null ? void 0 : _e.adminMembers) {
    (_g = (_f = $$props.arch) == null ? void 0 : _f.team) == null ? void 0 : _g.adminMembers.forEach(({ fullname, jobResponsibilities }) => {
      if (fullname && jobResponsibilities) adminMembers.push({ name: fullname, role: jobResponsibilities });
    });
  }
  const viewMembers = [];
  if ((_i = (_h = $$props.arch) == null ? void 0 : _h.team) == null ? void 0 : _i.viewMembers) {
    (_k = (_j = $$props.arch) == null ? void 0 : _j.team) == null ? void 0 : _k.viewMembers.forEach(({ fullname, jobResponsibilities }) => {
      if (fullname && jobResponsibilities) viewMembers.push({ name: fullname, role: jobResponsibilities });
    });
  }
  const editMembers = [];
  if ((_m = (_l = $$props.arch) == null ? void 0 : _l.team) == null ? void 0 : _m.editMembers) {
    (_o = (_n = $$props.arch) == null ? void 0 : _n.team) == null ? void 0 : _o.editMembers.forEach(({ fullname, jobResponsibilities }) => {
      if (fullname && jobResponsibilities) editMembers.push({ name: fullname, role: jobResponsibilities });
    });
  }
  var fragment = root$2();
  var node = sibling2(first_child(fragment), 2);
  if_block(
    node,
    () => !$$props.arch,
    ($$anchor2) => {
      var text$1 = text("No architecture selected.");
      append($$anchor2, text$1);
    },
    ($$anchor2) => {
      var fragment_1 = root_2$2();
      var table = first_child(fragment_1);
      var tbody = child(table);
      var tr = sibling2(child(tbody));
      var td = sibling2(child(tr));
      var text_1 = child(td);
      var tr_1 = sibling2(tr);
      var td_1 = sibling2(child(tr_1));
      var text_2 = child(td_1);
      var tr_2 = sibling2(tr_1);
      var td_2 = sibling2(child(tr_2));
      var text_3 = child(td_2);
      var tr_3 = sibling2(tr_2);
      var td_3 = sibling2(child(tr_3));
      td_3.textContent = owner;
      var tr_4 = sibling2(tr_3);
      var td_4 = sibling2(child(tr_4));
      var text_4 = child(td_4);
      var tr_5 = sibling2(tr_4);
      var td_5 = sibling2(child(tr_5));
      var text_5 = child(td_5);
      var table_1 = sibling2(table, 6);
      var tbody_1 = sibling2(child(table_1));
      var node_1 = child(tbody_1);
      each(node_1, 17, () => adminMembers, index, ($$anchor3, member) => {
        var tr_6 = root_3();
        var td_6 = child(tr_6);
        var text_6 = child(td_6);
        var td_7 = sibling2(td_6, 2);
        var text_7 = child(td_7);
        template_effect(() => {
          set_text(text_6, get10(member).name);
          set_text(text_7, get10(member).role);
        });
        append($$anchor3, tr_6);
      });
      var node_2 = sibling2(node_1);
      each(node_2, 17, () => editMembers, index, ($$anchor3, member) => {
        var tr_7 = root_4();
        var td_8 = child(tr_7);
        var text_8 = child(td_8);
        var td_9 = sibling2(td_8, 2);
        var text_9 = child(td_9);
        template_effect(() => {
          set_text(text_8, get10(member).name);
          set_text(text_9, get10(member).role);
        });
        append($$anchor3, tr_7);
      });
      var node_3 = sibling2(node_2);
      each(node_3, 17, () => viewMembers, index, ($$anchor3, member) => {
        var tr_8 = root_5$1();
        var td_10 = child(tr_8);
        var text_10 = child(td_10);
        var td_11 = sibling2(td_10, 2);
        var text_11 = child(td_11);
        template_effect(() => {
          set_text(text_10, get10(member).name);
          set_text(text_11, get10(member).role);
        });
        append($$anchor3, tr_8);
      });
      template_effect(() => {
        var _a3;
        set_text(text_1, $$props.arch.archId);
        set_text(text_2, $$props.arch.name);
        set_text(text_3, $$props.arch.clientName);
        set_text(text_4, $$props.arch.lastModified);
        set_text(text_5, (_a3 = $$props.arch.lastModifiedUser) == null ? void 0 : _a3.fullname);
      });
      append($$anchor2, fragment_1);
    }
  );
  append($$anchor, fragment);
  pop();
}
class CAArchfInfoModal extends obsidian.Modal {
  constructor(app) {
    super(app);
    __publicField(this, "component", null);
  }
  onOpen() {
    if (architecture.info) {
      this.component = mount(CAArchInfoModalComponent, {
        target: this.contentEl,
        props: {
          arch: architecture.info
          //ca: this.ca,
          //obsApp: this.app,
        }
      });
    }
  }
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
    this.component = null;
  }
}
var root_2$1 = /* @__PURE__ */ template(`<tr><td class="svelte-dbdod"> </td><td class="svelte-dbdod"> </td><td class="svelte-dbdod"> </td></tr>`);
var root$1 = /* @__PURE__ */ template(`<h3>Preview</h3> <img class="img_preview svelte-dbdod"> <h5>Elements in this artifact</h5> <table class="vertical- svelte-dbdod"><thead><tr><th class="svelte-dbdod">Element</th><th class="svelte-dbdod">Label</th><th class="svelte-dbdod">description</th></tr></thead><tbody></tbody></table>`, 1);
function ModalPreviewInstanceComponent($$anchor, $$props) {
  let responseElements = prop($$props, "responseElements", 19, () => []);
  function getDiagram() {
    if ($$props.responseDiagram) {
      const blob = new Blob([$$props.responseDiagram], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      return url;
    }
  }
  var fragment = root$1();
  var img = sibling2(first_child(fragment), 2);
  template_effect(() => set_attribute(img, "src", getDiagram()));
  var table = sibling2(img, 4);
  var tbody = sibling2(child(table));
  each(tbody, 21, responseElements, index, ($$anchor2, element2) => {
    var fragment_1 = comment();
    var node = first_child(fragment_1);
    if_block(node, () => get10(element2).owned != "-1", ($$anchor3) => {
      var tr = root_2$1();
      var td = child(tr);
      var text2 = child(td);
      var td_1 = sibling2(td);
      var text_1 = child(td_1);
      var td_2 = sibling2(td_1);
      var text_2 = child(td_2);
      template_effect(() => {
        set_text(text2, `${get10(element2).modelType ?? ""} ${(get10(element2).type ? "(" + get10(element2).type + ")" : "") ?? ""}`);
        set_text(text_1, get10(element2).label);
        set_text(text_2, get10(element2).description);
      });
      append($$anchor3, tr);
    });
    append($$anchor2, fragment_1);
  });
  append($$anchor, fragment);
}
class ModalPreviewInstance extends obsidian.Modal {
  constructor(app, resDiagram, resElements) {
    super(app);
    __privateAdd(this, _component, null);
    __publicField(this, "resDiagram", null);
    __publicField(this, "resElements");
    this.resDiagram = resDiagram;
    this.resElements = resElements;
  }
  onOpen() {
    __privateSet(this, _component, mount(ModalPreviewInstanceComponent, {
      target: this.contentEl,
      props: {
        responseDiagram: this.resDiagram,
        responseElements: this.resElements
        // obsApp: this.app,
      }
    }));
  }
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
    __privateSet(this, _component, null);
  }
}
_component = new WeakMap();
class CAObsidian {
  // used as fallback to identify an Obsidian template.
  constructor(ca, obsApp) {
    __publicField(this, "ca");
    __publicField(this, "obsApp");
    __publicField(this, "fullPathLog", "");
    __publicField(this, "templatePropId", "caTemplateModel");
    // used to identify a standard Obsidian template
    __publicField(this, "templateValueDefault", "default");
    this.ca = ca;
    this.obsApp = obsApp;
  }
  /** Save errors to a log file in markdown format
   * Depends on $errorMsgs store. */
  async saveLog(title) {
    this.fullPathLog = this.generateFolder() + "/Log.md";
    if (errorMsgs.value.length === 0) return;
    let file = this.obsApp.vault.getFileByPath(this.fullPathLog);
    try {
      let markdown = `
# ${new Intl.DateTimeFormat(void 0, { dateStyle: "short", timeStyle: "short" }).format(/* @__PURE__ */ new Date())} ${title}
`;
      markdown += "```\n";
      for (const error of errorMsgs.value.values()) {
        markdown += error + "\n";
      }
      markdown += "```\n";
      if (file) {
        this.obsApp.vault.process(file, (data2) => {
          return data2 = markdown + data2;
        });
      } else {
        file = await this.obsApp.vault.create(this.fullPathLog, markdown);
      }
    } catch (error) {
      return null;
    }
  }
  /** Opens log file in Obsidian editor */
  openLog() {
    const file2 = this.obsApp.vault.getAbstractFileByPath(this.fullPathLog);
    if (file2 instanceof obsidian.TFile) {
      this.obsApp.workspace.openLinkText(this.fullPathLog, "", true);
    } else {
      new obsidian.Notice("Note not found at the provided path.");
    }
  }
  /** Save a diagram as SVG or PNG image.
   * It will check if the artifact requested can actually have a diagram.
   * @param artifactFormat, the output format of the image.
   * @param selectedArtifactType
   * @param instanceId
   * @param outputFilename - you can pass the filename (without path and extension); otherwise the function will retrieve
   * the metadata to set the filename.
   * @returns the filename of the image (without the extension).
   */
  async saveDiagram(artifactFormat, selectedArtifactType, instanceId, outputFilename) {
    var _a2, _b;
    let fullPath = "";
    if (selectedArtifactType && ARTIFACT_WITH_DIAGRAM.contains(selectedArtifactType) && instanceId) {
      const res = await ((_a2 = this.ca) == null ? void 0 : _a2.getArtifactInstanceDiagram(architecture.selected, selectedArtifactType, instanceId, artifactFormat));
      if (res && this.obsApp) {
        if (!outputFilename) {
          const resElements = await ((_b = this.ca) == null ? void 0 : _b.getArtifactInstanceDetails(architecture.selected, selectedArtifactType, instanceId));
          if (resElements) {
            outputFilename = this.generateFilename(resElements[0]);
          } else {
            outputFilename = instanceId + "-" + architecture.selected;
          }
        }
        fullPath = this.generateFolder(true) + "/" + outputFilename + "." + artifactFormat;
        const file = this.obsApp.vault.getFileByPath(fullPath);
        if (file) await this.obsApp.vault.delete(file);
        let resCreate;
        try {
          if (artifactFormat === "png") {
            resCreate = await this.obsApp.vault.createBinary(fullPath, res);
          } else {
            resCreate = await this.obsApp.vault.create(fullPath, res);
          }
          if (resCreate != null) {
            return resCreate.basename;
          } else {
            console.warn("Couldn't create file");
            return null;
          }
        } catch (error) {
          return null;
        }
      }
    }
    return null;
  }
  /** Saves the elements of multiple instances to an Obsidian note.
   * The saving will happen sequentially otherwise there will be race conditions.
   * @param instances - an array of elements (typically multiple results of @function retrieveInstanceElements)
   */
  async saveElements(instances) {
    if (!this.obsApp || !instances) return;
    for (const instance of instances) {
      const allElements = instance.filter((element2) => element2.modelType != "GenericGroup");
      let diagramFile = null;
      if (Object.hasOwn(allElements[allElements.length - 1], "diagramFile")) {
        diagramFile = allElements[allElements.length - 1].diagramFile;
        allElements.pop();
      }
      let counter = 0;
      for (const element2 of allElements) {
        let markdown = "";
        if (counter == 0) {
          const files = this.getFilesWithProperties("caTemplateModel", element2.modelType);
          if (files.length > 0) {
            markdown = await this.obsApp.vault.read(files[0]);
          }
          if (markdown === "") {
            if (diagramFile) markdown = `# Diagram
![[${diagramFile}]]
`;
            const inArtifact = instance.filter((element22) => element22.owned != "-1");
            markdown += this.generateMarkdown(inArtifact);
          }
        }
        const folder = this.generateFolder(false, element2);
        const filename = folder + "/" + this.generateFilename(element2) + ".md";
        let file = this.obsApp.vault.getFileByPath(filename);
        try {
          if (file === null) {
            file = await this.obsApp.vault.create(filename, markdown);
            await this.obsApp.fileManager.processFrontMatter(file, (frontmatter) => {
              delete frontmatter[this.templatePropId];
              const { _id: id, ...rest } = element2;
              const updatedElement = { id, ...rest };
              Object.assign(frontmatter, updatedElement);
              frontmatter.architectureId = architecture.selected;
              if (element2.owned != "-1" && counter !== 0) {
                frontmatter.ownedByInstanceId = [allElements[0]._id];
              } else delete frontmatter.owned;
            });
          } else {
            await this.obsApp.fileManager.processFrontMatter(file, (frontmatter) => {
              if (element2.owned != "-1" && counter !== 0) {
                if (!Object.hasOwn(frontmatter, "ownedByInstanceId")) {
                  frontmatter.ownedByInstanceId = [allElements[0]._id];
                } else if (!frontmatter.ownedByInstanceId.contains(allElements[0]._id)) {
                  frontmatter.ownedByInstanceId = [
                    ...frontmatter.ownedByInstanceId,
                    allElements[0]._id
                  ];
                }
              }
            });
          }
        } catch (error) {
          const err = `${error}`;
          errorMsgs.value.push(err + " " + filename);
        }
        counter += 1;
      }
    }
  }
  /** Retrieve the elements of the instance of an artifact.
   * This is separated from saving to disk, because this function can run in parallel
   * Than sequentially write all instance elements to disk (because that can not be done in parallel)
   * It will save the diagram and metadata.
   * @param selectedArtifactType
   * @param instanceId
   * @param overWrite - overwrites the file if it exists, otherwise updates the file
   * @returns all the elements of the requested artifact instance. It adds a property 'diagramFile' with the location of a (optional) diagram.
   */
  async retrieveInstanceElements(selectedArtifactType, instanceId, overWrite = true) {
    var _a2;
    if (architecture.selected !== SELECT_NONE && instanceId) {
      const resElements = await ((_a2 = this.ca) == null ? void 0 : _a2.getArtifactInstanceDetails(architecture.selected, selectedArtifactType, instanceId));
      const diagramFormat = "svg";
      if (resElements && this.obsApp) {
        const diagramFileName = await this.saveDiagram(diagramFormat, selectedArtifactType, instanceId, this.generateFilename(resElements[0]));
        if (diagramFileName) resElements.push({
          diagramFile: diagramFileName + "." + diagramFormat
        });
        return resElements;
      }
    }
    return null;
  }
  generateMarkdown(elements) {
    let markdown = "\n# Elements in this artifact\n";
    markdown += `Functional requirements associated with this artifact

\`\`\`dataview
TABLE without ID link(file.link, label) as Name, modelType as Model, type as Type, description as Description
WHERE contains(architectureId,this.architectureId)
WHERE contains(ownedByInstanceId, this.id)
SORT modelType ASC

\`\`\`


`;
    return markdown;
  }
  /** Generates the path of the folder to store stuff, and creates the folder.
   * @param diagram - if true checks Settings for a diagrams subfolder, ands adds this to the path.
   * @param res (optional) - response from API to extract the folder for the artifact (not needed for saving images)
   * @returns path of folder - without a path divider ('/' or '\') at the end.
   */
  generateFolder(diagram = false, res) {
    var _a2, _b;
    let folder = "";
    folder = this.getSetting("baseFolder");
    if ((_a2 = architecture.info) == null ? void 0 : _a2.name) folder = folder + "/" + ((_b = architecture.info) == null ? void 0 : _b.name);
    if (this.getSetting("addIdentifierToFolder")) folder = folder + " - " + architecture.selected;
    if (diagram && this.getSetting("diagramsFolder")) folder = folder + "/" + this.getSetting("diagramsFolder");
    if (res) {
      if (res.modelType) folder = folder + "/" + res.modelType;
    }
    if (this.obsApp.vault.getFolderByPath(folder) === null) {
      try {
        this.obsApp.vault.createFolder(folder);
      } catch (error) {
      }
    }
    return folder;
  }
  /** Create a filename for an artifact or model element.
   * @param res - the Response from the API call the retrieve artifact instance meta data.
   * @returns filename - without path and extension.
   */
  generateFilename(res) {
    let filename = "";
    if (res) {
      if (res.modelType == "FunctionalRequirement") filename += res.fr_id + " ";
      if (res.modelType == "NonFunctionalRequirement") filename += res.nfr_id + " ";
      if (res.label) {
        filename += res.label.replace(/&[^;]+;/g, "").replace(/<\/?[^>]+(>|$)/g, "").replace(/[^a-zA-Z0-9 ()_\\-\\.]/g, "");
        filename += "_" + res._id.match(/[^_]+$/);
        if (filename.startsWith(".")) filename = filename.substring(1);
      } else filename = filename + res.modelType;
    }
    return filename;
  }
  /** Returns the handle to this plugin */
  getSetting(key) {
    const plugin = this.obsApp.plugins.getPlugin("ca-sync");
    return plugin.settings[key];
  }
  /** Search for a property in all files in the vault.
   * When you provide a value, it will only return the file in which the prop matches that value OR when the prop matches "default" (as a fallback scenario).
   * When you do not provide a value, it will return all files in which that property exists.
   * @returns Tfile[] - array of TFile object that match the property and optional values
   * @example getFileWithProperties("caTemplateMode", "SystemContext")
   */
  getFilesWithProperties(prop2, value) {
    const files = [];
    const allFiles = this.obsApp.vault.getFiles();
    for (const file of allFiles) {
      const metadata = this.obsApp.metadataCache.getFileCache(file);
      if (metadata && metadata.frontmatter && Object.hasOwn(metadata.frontmatter, prop2)) {
        if (value) {
          if (metadata.frontmatter[prop2] === value) files.push(file);
          if (metadata.frontmatter[prop2] === this.templateValueDefault) files.push(file);
        } else files.push(file);
      }
    }
    return files;
  }
}
class Progress {
  // the size of the individual steps to take
  constructor(start, end = 1, total) {
    __privateAdd(this, _start);
    // start position
    __privateAdd(this, _actual);
    // the actual position
    __privateAdd(this, _end);
    // the end position
    __privateAdd(this, _total);
    // the total number of steps to get there
    __privateAdd(this, _step2);
    __privateSet(this, _start, start);
    __privateSet(this, _actual, start);
    __privateSet(this, _end, end);
    __privateSet(this, _total, total);
    __privateSet(this, _step2, this.toCover / (__privateGet(this, _total) + 1));
  }
  get actual() {
    return __privateGet(this, _actual);
  }
  get total() {
    return __privateGet(this, _total);
  }
  get end() {
    return __privateGet(this, _end);
  }
  get toCover() {
    return __privateGet(this, _end) - __privateGet(this, _actual);
  }
  get step() {
    return __privateGet(this, _step2);
  }
  // Calculate the next step, modify and return the new progress status
  get next() {
    __privateSet(this, _actual, __privateGet(this, _actual) + this.step);
    return __privateGet(this, _actual);
  }
}
_start = new WeakMap();
_actual = new WeakMap();
_end = new WeakMap();
_total = new WeakMap();
_step2 = new WeakMap();
function gotoSettings(_, $$props) {
  $$props.obsApp.setting.open();
  $$props.obsApp.setting.openTabById("ca-sync");
}
function openLog(__1, caObsidian) {
  caObsidian.openLog();
}
function showArchitectureInfo(__2, $$props) {
  new CAArchfInfoModal($$props.obsApp).open();
}
var root_2 = /* @__PURE__ */ template(`<div aria-label="Information on selected architecture."><!></div>  <div aria-label="Save all architecture artifacts."><!></div>`, 1);
var root_1 = /* @__PURE__ */ template(`<div class="nav-header"><div class="nav-buttons-container"><div aria-label="Refresh architecture information..."><!></div>  <div aria-label="Settings for this plugin."><!></div> <!></div></div>`);
var root_5 = /* @__PURE__ */ template(`<a href="#">Open logfile...</a>`);
var on_change = (__3, getListArtifacts) => getListArtifacts();
var root_11 = /* @__PURE__ */ template(`<option selected disabled>None selected</option>`);
var root_12 = /* @__PURE__ */ template(`<option disabled>None selected</option>`);
var root_14 = /* @__PURE__ */ template(`<option> </option>`);
var root_8 = /* @__PURE__ */ template(`<div class="item_label svelte-wu7qat"><label for="arch_name">My Architectures <!></label></div> <div class="item_value svelte-wu7qat"><select name="arch_name" id="arch_names"><!><!></select></div>`, 1);
var root_20 = /* @__PURE__ */ template(`<div style="font-weight:500"> </div>`);
var on_click = (__4, getListInstances, artifact) => getListInstances(get10(artifact).artifactType, get10(artifact)._id);
var root_21 = /* @__PURE__ */ template(`<a href="#"> </a>`);
var root_19 = /* @__PURE__ */ template(`<li><!></li>`);
var root_24 = /* @__PURE__ */ template(`<option> </option>`);
var root_23 = /* @__PURE__ */ template(`<h6> </h6> <select class="item_value svelte-wu7qat" name="arch_artifact_instances" id="arch_artifact_instances"><option disabled selected>Select instance</option><!></select><br>`, 1);
var root_25 = /* @__PURE__ */ template(`<h6>Instance</h6> <div style="padding-left: 1rem"><!></div>`, 1);
var on_click_1 = (__5, saveDiagram) => saveDiagram("svg");
var on_click_2 = (__6, saveDiagram) => saveDiagram("png");
var on_click_3 = (__7, saveInstance) => saveInstance();
var root_22 = /* @__PURE__ */ template(`<!> <div class="buttons-container svelte-wu7qat"><div aria-label="Preview artifact"><!></div>  <div aria-label="Save as vector image (.svg)"><!></div>  <div aria-label="Save as bitmap image (.png)"><!></div>  <div aria-label="Save this artifact (diagram and elements)."><!></div></div>`, 1);
var root_17 = /* @__PURE__ */ template(`<div class="item_value svelte-wu7qat"> </div> <div class="item_value svelte-wu7qat" style="font-size: smaller;"> </div> <h5>Artifacts</h5> <ul><!></ul> <!>`, 1);
var root_7 = /* @__PURE__ */ template(`<div class="arch_information svelte-wu7qat"><!> <!></div>`);
var root_28 = /* @__PURE__ */ template(`<h5>Setup</h5> Provide your Personal Token in settings, to access the Cognitive Architect services.`, 1);
var root = /* @__PURE__ */ template(`<div><!> <div id="loading" class="svelte-wu7qat">Loading <progress></progress></div> <div id="error-container" class="svelte-wu7qat"><div id="error-text" class="svelte-wu7qat"><!></div>  <div id="error-icon" class="svelte-wu7qat"><!></div> <div id="error-msg" class="svelte-wu7qat"><!></div></div> <!> <!></div>`);
function CAViewComponent($$anchor, $$props) {
  push($$props, true);
  const $$stores = setup_stores();
  const $progress = () => store_get(progress, "$progress", $$stores);
  const caObsidian = new CAObsidian($$props.ca, $$props.obsApp);
  let selectedArtifactId = state(null);
  let selectedArtifactType = state(null);
  let selectedInstanceId = state(null);
  let loadEl;
  user_effect(() => {
    if (loadEl && $progress() == 0) loadEl.style.display = "none";
    else if (loadEl && $progress() >= 1) setTimeout(
      () => {
        loadEl.style.display = "none";
        progress.set(0, { duration: 0 });
      },
      600
    );
    else if (loadEl) loadEl.style.display = "block";
  });
  let errorEl;
  user_effect(() => {
    if (errorEl && errorMsgs.value[0]) {
      errorEl.style.display = "grid";
    } else {
      if (errorEl) errorEl.style.display = "none";
    }
  });
  function closeError() {
    errorEl.style.display = "none";
    errorMsgs.value = [];
  }
  function invalidateSelections(artifacts = true, instances = false) {
    errorMsgs.value = [];
    if (artifacts) {
      set(selectedArtifactId, null);
      set(selectedArtifactType, null);
    }
    if (instances) {
      set(selectedInstanceId, null);
    }
  }
  async function getListArchitectures() {
    var _a2, _b;
    progress.set(0.4);
    (_a2 = $$props.ca) == null ? void 0 : _a2.invalidate();
    invalidateSelections(true, true);
    if (!await ((_b = $$props.ca) == null ? void 0 : _b.getArchitecturesList(caObsidian.getSetting("retrievePrivateArchitectures"), caObsidian.getSetting("retrieveCollaborationArchitectures")))) {
      if (errorMsgs) {
        errorMsgs.value[errorMsgs.value.length] = "Cannot retrieve architectures (no connection or VPN? Wrong base Url?)";
      }
    }
    progress.set(1);
  }
  async function getListArtifacts() {
    var _a2, _b;
    invalidateSelections(true, true);
    progress.set(0.3);
    await ((_a2 = $$props.ca) == null ? void 0 : _a2.getArchitectureInfo(architecture.selected));
    progress.set(0.7);
    await ((_b = $$props.ca) == null ? void 0 : _b.getArtifactCatalog(architecture.selected));
    progress.set(1);
  }
  async function getListInstances(artifactType, artifactId, selectArtifact = true) {
    var _a2;
    if (artifactType && artifactId) {
      progress.set(0.4);
      invalidateSelections(true, true);
      await ((_a2 = $$props.ca) == null ? void 0 : _a2.getArtifactInstanceSummary(architecture.selected, artifactType, artifactId));
      progress.set(0.6, { duration: 0 });
      if (selectArtifact) {
        set(selectedArtifactType, proxy(artifactType));
        set(selectedArtifactId, proxy(artifactId));
        if (architecture.instances) {
          set(selectedInstanceId, proxy(architecture.instances[0]._id));
        }
      }
    }
    progress.set(1);
  }
  function saveDiagram(artifactFormat) {
    progress.set(0.4);
    if (get10(selectedArtifactType) && get10(selectedInstanceId)) caObsidian.saveDiagram(artifactFormat, get10(selectedArtifactType), get10(selectedInstanceId));
    caObsidian.saveLog("Save diagram");
    progress.set(1);
  }
  async function saveInstance() {
    progress.set(0.4);
    if (get10(selectedArtifactType) && get10(selectedInstanceId)) {
      const results = await caObsidian.retrieveInstanceElements(get10(selectedArtifactType), get10(selectedInstanceId));
      if (results) caObsidian.saveElements([results]);
    }
    caObsidian.saveLog("Save artifact");
    progress.set(1);
  }
  async function saveAll() {
    var _a2, _b;
    progress.set(0.1);
    await ((_a2 = $$props.ca) == null ? void 0 : _a2.getArtifactCatalog(architecture.selected));
    if (architecture.artifacts != null) {
      const progressArtifact = new Progress(0.2, 1, architecture.artifacts.length);
      progress.set(progressArtifact.actual);
      for (const [i, artifact] of architecture.artifacts.entries()) {
        await ((_b = $$props.ca) == null ? void 0 : _b.getArtifactInstanceSummary(architecture.selected, artifact.artifactType, artifact._id));
        progress.set(progressArtifact.next);
        if (artifact.artifactType !== void 0 && architecture.instances !== null) {
          const progressInstances = new Progress(progressArtifact.actual, progressArtifact.actual + progressArtifact.step, architecture.instances.length);
          const t0 = performance.now();
          const promises = architecture.instances.map((instance) => {
            progress.set(progressInstances.next);
            return caObsidian.retrieveInstanceElements(artifact.artifactType, instance._id, false);
          });
          const results = await Promise.allSettled(promises);
          const instances = [];
          results.forEach((result, index2) => {
            if (result.status === "fulfilled") {
              if (result.value !== null) instances.push(result.value);
            } else if (result.status === "rejected") {
              console.error(`Fetch ${index2} failed with error:`, result.reason);
            }
          });
          await caObsidian.saveElements(instances);
          (performance.now() - t0) / 1e3;
        }
      }
    }
    caObsidian.saveLog("Save all");
    progress.set(1);
  }
  async function previewInstance() {
    var _a2, _b;
    if (get10(selectedArtifactType) && get10(selectedInstanceId)) {
      const resDiagram = await ((_a2 = $$props.ca) == null ? void 0 : _a2.getArtifactInstanceDiagram(architecture.selected, get10(selectedArtifactType), get10(selectedInstanceId), "svg"));
      const resElements = await ((_b = $$props.ca) == null ? void 0 : _b.getArtifactInstanceDetails(architecture.selected, get10(selectedArtifactType), get10(selectedInstanceId)));
      if (resDiagram && resElements && $$props.obsApp) {
        new ModalPreviewInstance($$props.obsApp, resDiagram, resElements).open();
      }
    }
  }
  var div = root();
  var node = child(div);
  key_block(node, () => architecture.selected, ($$anchor2) => {
    var div_1 = root_1();
    var div_2 = child(div_1);
    var div_3 = child(div_2);
    div_3.__click = getListArchitectures;
    var node_1 = child(div_3);
    Refresh_cw(node_1, {
      id: "ca-refresh-btn",
      size: "30",
      class: "clickable-icon nav-action-button"
    });
    var div_4 = sibling2(div_3, 2);
    div_4.__click = [gotoSettings, $$props];
    var node_2 = child(div_4);
    Settings(node_2, {
      size: "30",
      class: "clickable-icon nav-action-button"
    });
    var node_3 = sibling2(div_4, 2);
    if_block(node_3, () => architecture.selected !== SELECT_NONE, ($$anchor3) => {
      var fragment = root_2();
      var div_5 = first_child(fragment);
      div_5.__click = [showArchitectureInfo, $$props];
      var node_4 = child(div_5);
      Info(node_4, {
        size: "30",
        class: "clickable-icon nav-action-button"
      });
      var div_6 = sibling2(div_5, 2);
      div_6.__click = saveAll;
      var node_5 = child(div_6);
      Download(node_5, {
        size: "30",
        class: "clickable-icon nav-action-button"
      });
      append($$anchor3, fragment);
    });
    append($$anchor2, div_1);
  });
  var div_7 = sibling2(node, 2);
  bind_this(div_7, ($$value) => loadEl = $$value, () => loadEl);
  var progress_1 = sibling2(child(div_7));
  var div_8 = sibling2(div_7, 2);
  bind_this(div_8, ($$value) => errorEl = $$value, () => errorEl);
  var div_9 = child(div_8);
  var node_6 = child(div_9);
  if_block(
    node_6,
    () => errorMsgs.value.length > 1,
    ($$anchor2) => {
      var text$1 = text();
      template_effect(() => set_text(text$1, `${errorMsgs.value.length ?? ""} errors`));
      append($$anchor2, text$1);
    },
    ($$anchor2) => {
      var text_1 = text("Error");
      append($$anchor2, text_1);
    }
  );
  var div_10 = sibling2(div_9, 2);
  div_10.__click = closeError;
  var node_7 = child(div_10);
  Circle_x(node_7, {
    size: "26",
    color: "red",
    class: "clickable-icon nav-action-button"
  });
  var div_11 = sibling2(div_10, 2);
  var node_8 = child(div_11);
  if_block(
    node_8,
    () => errorMsgs.value.length > 1,
    ($$anchor2) => {
      var a2 = root_5();
      a2.__click = [openLog, caObsidian];
      append($$anchor2, a2);
    },
    ($$anchor2) => {
      var text_2 = text();
      template_effect(() => set_text(text_2, errorMsgs.value[0]));
      append($$anchor2, text_2);
    }
  );
  var node_9 = sibling2(div_8, 2);
  key_block(node_9, () => archList, ($$anchor2) => {
    var div_12 = root_7();
    var node_10 = child(div_12);
    if_block(
      node_10,
      () => archList.value,
      ($$anchor3) => {
        var fragment_3 = root_8();
        var div_13 = first_child(fragment_3);
        var label = child(div_13);
        var node_11 = sibling2(child(label));
        if_block(
          node_11,
          () => archList.value !== null && archList.value !== void 0,
          ($$anchor4) => {
            var text_3 = text();
            template_effect(() => set_text(text_3, `(${archList.value.length ?? ""})`));
            append($$anchor4, text_3);
          },
          ($$anchor4) => {
            var text_4 = text("(0)");
            append($$anchor4, text_4);
          }
        );
        var div_14 = sibling2(div_13, 2);
        var select = child(div_14);
        select.__change = [on_change, getListArtifacts];
        var node_12 = child(select);
        if_block(
          node_12,
          () => architecture.selected === SELECT_NONE,
          ($$anchor4) => {
            var option = root_11();
            option.value = null == (option.__value = "none") ? "" : "none";
            append($$anchor4, option);
          },
          ($$anchor4) => {
            var option_1 = root_12();
            option_1.value = null == (option_1.__value = "none") ? "" : "none";
            append($$anchor4, option_1);
          }
        );
        var node_13 = sibling2(node_12);
        if_block(node_13, () => archList.value !== null && archList.value !== void 0, ($$anchor4) => {
          var fragment_5 = comment();
          var node_14 = first_child(fragment_5);
          const $$array = () => archList.value;
          each(node_14, 17, $$array, index, ($$anchor5, architecture2) => {
            var option_2 = root_14();
            var option_2_value = {};
            var text_5 = child(option_2);
            template_effect(() => {
              if (option_2_value !== (option_2_value = get10(architecture2)._id)) {
                option_2.value = null == (option_2.__value = get10(architecture2)._id) ? "" : get10(architecture2)._id;
              }
              set_text(text_5, get10(architecture2).name);
            });
            append($$anchor5, option_2);
          });
          append($$anchor4, fragment_5);
        });
        bind_select_value(select, () => architecture.selected, ($$value) => architecture.selected = $$value);
        append($$anchor3, fragment_3);
      },
      ($$anchor3) => {
        var fragment_6 = comment();
        var node_15 = first_child(fragment_6);
        if_block(
          node_15,
          () => {
            var _a2;
            return (_a2 = $$props.ca) == null ? void 0 : _a2.isTokenSet();
          },
          ($$anchor4) => {
            var text_6 = text("Hit Refresh to load architectures");
            append($$anchor4, text_6);
          },
          null,
          true
        );
        append($$anchor3, fragment_6);
      }
    );
    var node_16 = sibling2(node_10, 2);
    if_block(node_16, () => architecture.info, ($$anchor3) => {
      var fragment_7 = root_17();
      var div_15 = first_child(fragment_7);
      var text_7 = child(div_15);
      var div_16 = sibling2(div_15, 2);
      var text_8 = child(div_16);
      var ul = sibling2(div_16, 4);
      var node_17 = child(ul);
      if_block(node_17, () => architecture.artifacts != null, ($$anchor4) => {
        var fragment_8 = comment();
        var node_18 = first_child(fragment_8);
        each(node_18, 17, () => architecture.artifacts, index, ($$anchor5, artifact) => {
          var li = root_19();
          var node_19 = child(li);
          if_block(
            node_19,
            () => get10(artifact)._id === get10(selectedArtifactId),
            ($$anchor6) => {
              var div_17 = root_20();
              var text_9 = child(div_17);
              template_effect(() => set_text(text_9, get10(artifact).displayName));
              append($$anchor6, div_17);
            },
            ($$anchor6) => {
              var a_1 = root_21();
              a_1.__click = [on_click, getListInstances, artifact];
              var text_10 = child(a_1);
              template_effect(() => set_text(text_10, get10(artifact).displayName));
              append($$anchor6, a_1);
            }
          );
          append($$anchor5, li);
        });
        append($$anchor4, fragment_8);
      });
      var node_20 = sibling2(ul, 2);
      if_block(node_20, () => get10(selectedArtifactType) && architecture.instances != null, ($$anchor4) => {
        var fragment_9 = root_22();
        var node_21 = first_child(fragment_9);
        if_block(
          node_21,
          () => architecture.instances.length > 1,
          ($$anchor5) => {
            var fragment_10 = root_23();
            var h6 = first_child(fragment_10);
            var text_11 = child(h6);
            var select_1 = sibling2(h6, 2);
            var option_3 = child(select_1);
            option_3.value = null == (option_3.__value = "") ? "" : "";
            var node_22 = sibling2(option_3);
            each(node_22, 17, () => architecture.instances, index, ($$anchor6, artifactInstance) => {
              var option_4 = root_24();
              var option_4_value = {};
              var text_12 = child(option_4);
              template_effect(() => {
                if (option_4_value !== (option_4_value = get10(artifactInstance)._id)) {
                  option_4.value = null == (option_4.__value = get10(artifactInstance)._id) ? "" : get10(artifactInstance)._id;
                }
                set_text(text_12, get10(artifactInstance).name);
              });
              append($$anchor6, option_4);
            });
            template_effect(() => set_text(text_11, `Instances (1 of ${architecture.instances.length ?? ""})`));
            bind_select_value(select_1, () => get10(selectedInstanceId), ($$value) => set(selectedInstanceId, $$value));
            append($$anchor5, fragment_10);
          },
          ($$anchor5) => {
            var fragment_11 = root_25();
            var div_18 = sibling2(first_child(fragment_11), 2);
            var node_23 = child(div_18);
            if_block(
              node_23,
              () => architecture.instances[0].name,
              ($$anchor6) => {
                var text_13 = text();
                template_effect(() => set_text(text_13, architecture.instances[0].name));
                append($$anchor6, text_13);
              },
              ($$anchor6) => {
                var text_14 = text();
                template_effect(() => {
                  var _a2;
                  return set_text(text_14, (_a2 = $$props.ca) == null ? void 0 : _a2.getArtifactName(get10(selectedArtifactType)));
                });
                append($$anchor6, text_14);
              }
            );
            append($$anchor5, fragment_11);
          }
        );
        var div_19 = sibling2(node_21, 2);
        var div_20 = child(div_19);
        div_20.__click = previewInstance;
        var node_24 = child(div_20);
        View(node_24, {
          size: 32,
          class: "clickable-icon nav-action-button"
        });
        var div_21 = sibling2(div_20, 2);
        div_21.__click = [on_click_1, saveDiagram];
        var node_25 = child(div_21);
        Svg(node_25, {
          size: 32,
          class: "clickable-icon nav-action-button"
        });
        var div_22 = sibling2(div_21, 2);
        div_22.__click = [on_click_2, saveDiagram];
        var node_26 = child(div_22);
        Png(node_26, {
          size: 32,
          class: "clickable-icon nav-action-button"
        });
        var div_23 = sibling2(div_22, 2);
        div_23.__click = [on_click_3, saveInstance];
        var node_27 = child(div_23);
        DocumentDownload(node_27, {
          size: 32,
          class: "clickable-icon nav-action-button"
        });
        append($$anchor4, fragment_9);
      });
      template_effect(() => {
        set_text(text_7, architecture.info.clientName);
        set_text(text_8, `Updated ${architecture.info.lastModified ?? ""}`);
      });
      append($$anchor3, fragment_7);
    });
    append($$anchor2, div_12);
  });
  var node_28 = sibling2(node_9, 2);
  if_block(node_28, () => {
    var _a2;
    return !((_a2 = $$props.ca) == null ? void 0 : _a2.isTokenSet());
  }, ($$anchor2) => {
    var fragment_14 = root_28();
    append($$anchor2, fragment_14);
  });
  template_effect(() => set_value(progress_1, $progress()));
  append($$anchor, div);
  pop();
}
delegate(["click", "change"]);
class CAArchitecture {
  constructor(baseUrl) {
    __privateAdd(this, _baseURL, "");
    __privateAdd(this, _personal_token, "");
    __privateSet(this, _baseURL, baseUrl);
  }
  /** Retrieve all private architectures of the user (that belong to the Personal Token)
   * Sets the result in architecuresList field and triggers the onUpdate function (for clients to respond to).
   */
  async getAllPrivateArchitectures() {
    const headers = {
      Authorization: "token " + __privateGet(this, _personal_token),
      accept: "application/json"
    };
    try {
      const response = await obsidian.requestUrl({
        method: "PUT",
        url: __privateGet(this, _baseURL) + "/api/aggregatesvc/WorkspaceFacadeAPIs/owned/architectures?status=Pending",
        headers
      });
      if (response.status === 200) {
        archList.value = response.json.data;
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }
  /** Retrieve a list of all architectures of the user (checks settings for the type of architectures to list)
   * Sets the result in architecuresList field and triggers the onUpdate function (for clients to respond to).
   */
  async getArchitecturesList(privateArchitectures = true, collaborationArchitectures = false) {
    let listArch = [];
    if (privateArchitectures) {
      const response = await this.getArchitectures("/api/aggregatesvc/WorkspaceFacadeAPIs/owned/architectures?status=Pending");
      if (response) listArch = response;
    }
    if (collaborationArchitectures) {
      const response = await this.getArchitectures("/api/aggregatesvc/WorkspaceFacadeAPIs/shared/architectures/private");
      if (response) listArch = [...listArch, ...response];
    }
    if (listArch.length > 0) {
      archList.value = listArch;
      return true;
    }
    return false;
  }
  /** Get list of architectures.
   * @param url the url (not including baseURL) to get architectures from
   * @returns
   */
  async getArchitectures(url) {
    if (!url) return null;
    const headers = {
      Authorization: "token " + __privateGet(this, _personal_token),
      accept: "application/json"
    };
    try {
      const response = await obsidian.requestUrl({
        method: "PUT",
        url: __privateGet(this, _baseURL) + url,
        headers
      });
      if (response.status === 200) {
        return response.json.data;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  }
  /** Retrieve meta data of an architecture
   * @param archId - id of architecture
   * @returns nothing - a store (archInfo) is populated with meta data of the architecture.
   */
  async getArchitectureInfo(archId) {
    if (archId === void 0) return;
    const headers = {
      Authorization: "token " + __privateGet(this, _personal_token),
      accept: "application/json"
    };
    try {
      const response = await obsidian.requestUrl({
        url: __privateGet(this, _baseURL) + "/api/architectures/" + archId,
        headers
      });
      if (response.status === 200) {
        architecture.selected = archId;
        architecture.info = response.json;
      } else {
      }
    } catch (error) {
      const err = `Can't retrieve information on architecture.`;
      errorMsgs.value.push(err);
    }
  }
  /** Retrieve a list of all artifacts of an architecture
   * @param @param archId - id of architecture
   * @returns nothing - a store (archArtifacts) is populated with the architecture artifacts.
   */
  async getArtifactCatalog(archId) {
    if (archId === void 0) return;
    const headers = {
      Authorization: "token " + __privateGet(this, _personal_token),
      accept: "application/json"
    };
    try {
      const response = await obsidian.requestUrl({
        url: __privateGet(this, _baseURL) + "/api/architecturesvc/ArchitectureAPIs/architectures/" + archId + "/artifacts/catalog",
        headers
      });
      if (response.status === 200) {
        if (response.json.archId !== "") {
          architecture.artifacts = this.filterArtifacts(response.json);
        }
      }
    } catch (error) {
      const err = `Can't retrieve artefacts of architecture.`;
      errorMsgs.value.push(err);
    }
  }
  /**
   * Retrieves a list of all the instances of an artifact.
   * @param archId
   * @param artifactType
   * @param artifactTypeId - an optional additional filter. Artifacts like RACI, Sizing and Notes are all of type Notes; you can filter those with the artifactId.
   * @returns nothing, sets a store (archArtifactInstancesList) that lists all the instances of this artifact.
   */
  async getArtifactInstanceSummary(archId, artifactType, artifactTypeId) {
    if (archId == null && artifactType == null) {
      console.warn(`Not provided valid arguments`);
      return;
    }
    const headers = {
      Authorization: "token " + __privateGet(this, _personal_token),
      accept: "application/json"
    };
    try {
      const response = await obsidian.requestUrl({
        url: __privateGet(this, _baseURL) + "/api/architectures/" + archId + "/artifacts/instances?artifactType=" + artifactType,
        headers
      });
      if (response.status === 200) {
        if (artifactTypeId && Object.hasOwn(response.json[0], "artifactTypeId")) {
          architecture.instances = response.json.filter((item) => item.artifactTypeId === artifactTypeId);
        } else {
          architecture.instances = response.json;
        }
      }
    } catch (error) {
      const err = `Can't retrieve instances of an artefact.`;
      errorMsgs.value.push(err);
    }
  }
  /**
   * Retrieves the meta data of an instance of an artifact.
   * @param archId - id of the architecture
   * @param artifactType - the type of artifact to retrieve
   * @param instanceId - id of the instance of an artifact.
   * @returns nothing, sets a store that holds the information.
   */
  async getArtifactInstanceDetails(archId, artifactType, instanceId) {
    if (archId == null && artifactType == null) {
      console.warn(`Not provided valid arguments`);
      return null;
    }
    const headers = {
      Authorization: "token " + __privateGet(this, _personal_token),
      accept: "application/json"
    };
    try {
      const response = await obsidian.requestUrl({
        url: __privateGet(this, _baseURL) + "/api/architectures/" + archId + "/artifacts/instances/" + instanceId + "?artifactType=" + artifactType,
        method: "POST",
        headers
      });
      if (response.status === 200) {
        architecture.elements = response.json.coreInfo;
        return response.json.coreInfo;
      } else return null;
    } catch (error) {
      const err = `Can't retrieve the meta data an instance of an artefact.`;
      errorMsgs.value.push(err);
      return null;
    }
  }
  /**
   * Retrieve the image of an artifact instance.
   * @param archId - id of the architecture
   * @param artifactType - the type of artifact to retrieve
   * @param instanceId - id of the instance of an artifact.
   * @param artifactFormat - the format of the image
   * @returns returns the artifact content as either ArrayBuffer (binary) or a string; null if something went wrong.
   */
  async getArtifactInstanceDiagram(archId, artifactType, instanceId, artifactFormat) {
    if (archId == null && artifactType == null && instanceId == null && ARTIFACT_WITH_DIAGRAM.includes(artifactType)) {
      errorMsgs.value.push("Requested artifact is not a digram");
      console.warn(`Not provided valid arguments, or requested artifact is not a diagram`);
      return null;
    }
    const headers = {
      Authorization: "token " + __privateGet(this, _personal_token)
      //accept: "application/json",
    };
    try {
      const response = await obsidian.requestUrl({
        url: __privateGet(this, _baseURL) + "/api/architectures/" + archId + "/instances/" + instanceId + "/diagram?artifactType=" + artifactType + "&format=" + artifactFormat,
        headers
      });
      if (response.status === 200) {
        if (artifactFormat === "svg") {
          return response.text;
        } else {
          return response.arrayBuffer;
        }
      } else return null;
    } catch (error) {
      const err = `Can't retrieve diagram.`;
      errorMsgs.value.push(err);
      return null;
    }
  }
  /** Filter artifacts that have content.
   * CA returns an array of nested objects that represent all possible artificats.
   * Only artificats that have attribute hasContent:true actually have been created in CA.
   * This method recursively goes through the tree to find the created artifacts.
   * @see: https://stackoverflow.com/questions/61313282/get-an-array-of-objects-that-match-condition-in-nested-object
   * @param data - json response from CA with all objects
   */
  filterArtifacts(data2) {
    const findNested = (children, predicate2) => {
      const found = [];
      for (const node of children) {
        if (node.child) {
          found.push(...findNested(node.child, predicate2));
        }
        if (predicate2(node)) {
          found.push(node);
        }
      }
      return found;
    };
    const predicate = (e2) => e2.hasContent && e2.hasContent === true;
    return findNested(data2, predicate);
  }
  /** Clears all data from this class.
   * It does not clear data at the Cognitive Architect service. Use this, for example, if you change the Personal Token. */
  invalidate() {
    archList.value = null;
    architecture.info = null;
    architecture.artifacts = null;
    architecture.selected = SELECT_NONE;
  }
  /** Set the personal token to access the Cognitive Architect services.*/
  setToken(token) {
    __privateSet(this, _personal_token, token);
  }
  setBaseUrl(baseURL) {
    __privateSet(this, _baseURL, baseURL);
  }
  /** Utility to check if Personal Token is set */
  isTokenSet() {
    return __privateGet(this, _personal_token) ? true : false;
  }
  /** Returns a human readable name of the provided artifact type.
   * @param artifactType
   * @returns human readable artifact name.
   */
  getArtifactName(artifactType) {
    switch (artifactType) {
      case "assetartifact_architecture_principles":
        return "Architectural Principles";
      case "assetartifact_architecturedecision":
        return "Architectural Decision";
      case "assetartifact_architectureoverview_aodservice":
        return "Services View";
      case "assetartifact_architectureoverview_itsystem":
        return "IT System View";
      case "assetartifact_architectureoverview_enterprise":
        return "Architecture Overview - Enterprise View";
      case "assetartifact_architectureoverview_usagescenario":
        return "Architecture Overview - Usage Scenario";
      case "assetartifact_assumption":
        return "Assumption";
      case "assetartifact_businesschallenge":
        return "Business Challenge";
      case "assetartifact_componentmodel_dynamicview":
        return "Component Model - Dynamic View";
      case "assetartifact_componentmodel_staticview":
        return "Component Model - Static View";
      case "assetartifact_dependency":
        return "Dependency";
      case "assetartifact_executivesummary":
        return "Executive Summary";
      case "assetartifact_functionalrequirement":
        return "Functional Requirement";
      case "assetartifact_issue":
        return "Issue";
      case "assetartifact_logical_datamodel":
        return "Logical Data Model";
      case "assetartifact_nonfunctionalrequirement":
        return "Non Functional Requirement";
      case "assetartifact_notes":
        return "Notes";
      case "assetartifact_operationalmodel_logicaloperational":
        return "Logical Operational View";
      case "assetartifact_operationalmodel_physicaloperational":
        return "Prescribed Operational View";
      case "assetartifact_risk":
        return "Risk";
      case "assetartifact_systemcontext":
        return "System Context";
      case "assetartifact_usecase_ucdiagram":
        return "Use Case Diagram";
      case "assetartifact_usecase_uctext":
        return "Use Case Text";
      default:
        return "";
    }
  }
}
_baseURL = new WeakMap();
_personal_token = new WeakMap();
const VIEW_TYPE = "ca-view";
class CAView extends obsidian.ItemView {
  constructor(leaf, ca) {
    super(leaf);
    __publicField(this, "component", null);
    __publicField(this, "ca", null);
    this.ca = ca;
  }
  getViewType() {
    return VIEW_TYPE;
  }
  getDisplayText() {
    return "Cognitive Architect Sync";
  }
  getIcon() {
    return CA_ICON_NAME;
  }
  async onOpen() {
    this.component = mount(CAViewComponent, {
      target: this.contentEl,
      props: {
        ca: this.ca,
        obsApp: this.app
      }
    });
  }
}
const DEFAULT_SETTINGS = {
  baseUrl: "",
  personalToken: "",
  baseFolder: "CA Import",
  diagramsFolder: "Diagrams",
  addIdentifierToFolder: false,
  retrievePrivateArchitectures: true,
  retrieveCollaborationArchitectures: false
};
class CASettingTab extends obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    __publicField(this, "plugin");
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new obsidian.Setting(containerEl).setName("General").setHeading();
    new obsidian.Setting(containerEl).setName("Artifacts import folder").setDesc("Folder to save imported Cognitive Architect artifacts to (relative to Vaults root folder)").addText(
      (text2) => text2.setPlaceholder("Enter path").setValue(this.plugin.settings.baseFolder).onChange(async (value) => {
        if (value.startsWith("/") || value.startsWith("\\")) value = value.substring(1);
        if (value.endsWith("/") || value.endsWith("\\")) value = value.substring(0, value.length - 1);
        this.plugin.settings.baseFolder = value;
        await this.plugin.saveSettings();
        this.app.workspace.getLeavesOfType(VIEW_TYPE).forEach((leaf) => {
          if (leaf.view instanceof CAView) {
            leaf.rebuildView();
          }
        });
      })
    );
    new obsidian.Setting(containerEl).setName("Diagrams subfolder").setDesc(
      "Add all diagrams (.svg or .png files) to a subfolder of the import folder.                  Leave empty to include in Artificats Import Folder."
    ).addText(
      (text2) => text2.setPlaceholder("Enter path").setValue(this.plugin.settings.diagramsFolder).onChange(async (value) => {
        if (value.startsWith("/") || value.startsWith("\\")) value = value.substring(1);
        if (value.endsWith("/") || value.endsWith("\\")) value = value.substring(0, value.length - 1);
        this.plugin.settings.baseFolder = value;
        await this.plugin.saveSettings();
        this.app.workspace.getLeavesOfType(VIEW_TYPE).forEach((leaf) => {
          if (leaf.view instanceof CAView) {
            leaf.rebuildView();
          }
        });
      })
    );
    new obsidian.Setting(containerEl).setName("Private architectures").setDesc("Include your private architectures").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.retrievePrivateArchitectures).onChange(async (value) => {
        this.plugin.settings.retrievePrivateArchitectures = value;
        await this.plugin.saveSettings();
      })
    );
    new obsidian.Setting(containerEl).setName("Collaboration architectures").setDesc("Include your collaboration architectures").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.retrieveCollaborationArchitectures).onChange(async (value) => {
        this.plugin.settings.retrieveCollaborationArchitectures = value;
        await this.plugin.saveSettings();
      })
    );
    new obsidian.Setting(containerEl).setName("Remote service").setHeading();
    new obsidian.Setting(containerEl).setName("Base URL").setDesc("The base url for the Cognitive Architect / IT Architect Assistant service (something like https://.../)").addText(
      (text2) => text2.setPlaceholder("Enter url like https://...").setValue(this.plugin.settings.baseUrl).onChange(async (value) => {
        if (value.endsWith("/")) value = value.substring(0, value.length - 1);
        this.plugin.settings.baseUrl = value;
        await this.plugin.saveSettings();
        this.app.workspace.getLeavesOfType(VIEW_TYPE).forEach((leaf) => {
          if (leaf.view instanceof CAView) {
            leaf.rebuildView();
          }
        });
      })
    );
    new obsidian.Setting(containerEl).setName("Personal token").setDesc("Request a personal token at cogarch@us.ibm.com").addText(
      (text2) => text2.setPlaceholder("Enter Personal Token").setValue(this.plugin.settings.personalToken).onChange(async (value) => {
        this.plugin.settings.personalToken = value;
        await this.plugin.saveSettings();
        this.app.workspace.getLeavesOfType(VIEW_TYPE).forEach((leaf) => {
          if (leaf.view instanceof CAView) {
            leaf.rebuildView();
          }
        });
      })
    );
    new obsidian.Setting(containerEl).setName("Extra").setHeading();
    new obsidian.Setting(containerEl).setName("Add identifier to project folder").setDesc(
      "Add an identifier to the architecture folder to make the folder more unique.                 Should not be necessary as names are unique in Cognitive Architect."
    ).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.addIdentifierToFolder).onChange(async (value) => {
        this.plugin.settings.addIdentifierToFolder = value;
        await this.plugin.saveSettings();
      })
    );
  }
}
const CA_ICON_NAME = "monitor-down";
class CAPlugin extends obsidian.Plugin {
  constructor() {
    super(...arguments);
    __publicField(this, "settings", DEFAULT_SETTINGS);
    __publicField(this, "ca", null);
  }
  async onload() {
    await this.loadSettings();
    this.ca = new CAArchitecture(this.settings.baseUrl);
    this.ca.setToken(this.settings.personalToken);
    this.registerView(VIEW_TYPE, (leaf) => new CAView(leaf, this.ca));
    this.app.workspace.onLayoutReady(this.onLayoutReady.bind(this));
    this.addRibbonIcon(CA_ICON_NAME, "Open Cognitive Architect Sync sidepanel", () => {
      this.activateView();
    });
    this.addSettingTab(new CASettingTab(this.app, this));
    this.addCommand({
      id: "open-caview",
      name: "Open Cognitive Architect Sync panel.",
      callback: () => this.activateView()
    });
  }
  onLayoutReady() {
    var _a2;
    if (this.app.workspace.getLeavesOfType(VIEW_TYPE).length) {
      this.activateView();
      return;
    }
    (_a2 = this.app.workspace.getRightLeaf(false)) == null ? void 0 : _a2.setViewState({
      type: VIEW_TYPE
    });
    this.app.workspace.rightSplit.collapsed && this.app.workspace.rightSplit.toggle();
  }
  onunload() {
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    var _a2;
    (_a2 = this.ca) == null ? void 0 : _a2.invalidate();
    await this.saveData(this.settings);
    if (this.ca) {
      this.ca.setToken(this.settings.personalToken);
      this.ca.setBaseUrl(this.settings.baseUrl);
    }
  }
  async openMapView() {
    const workspace = this.app.workspace;
    workspace.detachLeavesOfType(VIEW_TYPE);
    const leaf = workspace.getLeaf(
      // @ts-ignore
      !obsidian.Platform.isMobile
    );
    await leaf.setViewState({ type: VIEW_TYPE });
    workspace.revealLeaf(leaf);
  }
  async activateView() {
    var _a2;
    if (!this.app.workspace.getLeavesOfType(VIEW_TYPE).length) {
      await ((_a2 = this.app.workspace.getRightLeaf(false)) == null ? void 0 : _a2.setViewState({
        type: VIEW_TYPE,
        active: true
      }));
    }
    this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]);
  }
}
exports.CA_ICON_NAME = CA_ICON_NAME;
exports.default = CAPlugin;


/* nosourcemap */