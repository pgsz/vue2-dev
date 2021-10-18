/*!
 * Vue.js v2.6.12
 * (c) 2014-2021 Evan You
 * Released under the MIT License.
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.Vue = factory());
}(this, (function () { 'use strict';

  /*  */

  var emptyObject = Object.freeze({});

  // These helpers produce better VM code in JS engines due to their
  // explicitness and function inlining.
  function isUndef (v) {
    return v === undefined || v === null
  }

  // 不是 undefined 和 null 类型
  function isDef (v) {
    return v !== undefined && v !== null
  }

  function isTrue (v) {
    return v === true
  }

  function isFalse (v) {
    return v === false
  }

  /**
   * Check if value is primitive.
   */
  function isPrimitive (value) {
    return (
      typeof value === 'string' ||
      typeof value === 'number' ||
      // $flow-disable-line
      typeof value === 'symbol' ||
      typeof value === 'boolean'
    )
  }

  /**
   * Quick object check - this is primarily used to tell
   * Objects from primitive values when we know the value
   * is a JSON-compliant type.
   */
  function isObject (obj) {
    return obj !== null && typeof obj === 'object'
  }

  /**
   * Get the raw type string of a value, e.g., [object Object].
   */
  var _toString = Object.prototype.toString;

  function toRawType (value) {
    return _toString.call(value).slice(8, -1)
  }

  /**
   * Strict object type check. Only returns true
   * for plain JavaScript objects.
   */
  function isPlainObject (obj) {
    return _toString.call(obj) === '[object Object]'
  }

  function isRegExp (v) {
    return _toString.call(v) === '[object RegExp]'
  }

  /**
   * Check if val is a valid array index.
   * 检查val是否是一个有效的数组索引
   * >= 0 
   * 整数
   * 是不是无穷大 
   */
  function isValidArrayIndex (val) {
    var n = parseFloat(String(val));
    return n >= 0 && Math.floor(n) === n && isFinite(val)
  }

  function isPromise (val) {
    return (
      isDef(val) &&
      typeof val.then === 'function' &&
      typeof val.catch === 'function'
    )
  }

  /**
   * Convert a value to a string that is actually rendered.
   */
  function toString (val) {
    return val == null
      ? ''
      : Array.isArray(val) || (isPlainObject(val) && val.toString === _toString)
        ? JSON.stringify(val, null, 2)
        : String(val)
  }

  /**
   * Convert an input value to a number for persistence.
   * If the conversion fails, return original string.
   */
  function toNumber (val) {
    var n = parseFloat(val);
    return isNaN(n) ? val : n
  }

  /**
   * Make a map and return a function for checking if a key
   * is in that map.
   */
  function makeMap (
    str,
    expectsLowerCase
  ) {
    var map = Object.create(null);
    var list = str.split(',');
    for (var i = 0; i < list.length; i++) {
      map[list[i]] = true;
    }
    return expectsLowerCase
      ? function (val) { return map[val.toLowerCase()]; }
      : function (val) { return map[val]; }
  }

  /**
   * Check if a tag is a built-in tag.
   */
  var isBuiltInTag = makeMap('slot,component', true);

  /**
   * Check if an attribute is a reserved attribute.
   */
  var isReservedAttribute = makeMap('key,ref,slot,slot-scope,is');

  /**
   * Remove an item from an array.
   */
  function remove (arr, item) {
    if (arr.length) {
      var index = arr.indexOf(item);
      if (index > -1) {
        return arr.splice(index, 1)
      }
    }
  }

  /**
   * Check whether an object has the property.
   */
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  function hasOwn (obj, key) {
    return hasOwnProperty.call(obj, key)
  }

  /**
   * Create a cached version of a pure function.
   */
  function cached (fn) {
    var cache = Object.create(null);
    return (function cachedFn (str) {
      var hit = cache[str];
      return hit || (cache[str] = fn(str))
    })
  }

  /**
   * Camelize a hyphen-delimited string.
   */
  var camelizeRE = /-(\w)/g;
  var camelize = cached(function (str) {
    return str.replace(camelizeRE, function (_, c) { return c ? c.toUpperCase() : ''; })
  });

  /**
   * Capitalize a string.
   */
  var capitalize = cached(function (str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  });

  /**
   * Hyphenate a camelCase string.
   */
  var hyphenateRE = /\B([A-Z])/g;
  var hyphenate = cached(function (str) {
    return str.replace(hyphenateRE, '-$1').toLowerCase()
  });

  /**
   * Simple bind polyfill for environments that do not support it,
   * e.g., PhantomJS 1.x. Technically, we don't need this anymore
   * since native bind is now performant enough in most browsers.
   * But removing it would mean breaking code that was able to run in
   * PhantomJS 1.x, so this must be kept for backward compatibility.
   */

  /* istanbul ignore next */
  function polyfillBind (fn, ctx) {
    function boundFn (a) {
      var l = arguments.length;
      return l
        ? l > 1
          ? fn.apply(ctx, arguments)
          : fn.call(ctx, a)
        : fn.call(ctx)
    }

    boundFn._length = fn.length;
    return boundFn
  }

  function nativeBind (fn, ctx) {
    return fn.bind(ctx)
  }

  var bind = Function.prototype.bind
    ? nativeBind
    : polyfillBind;

  /**
   * Convert an Array-like object to a real Array.
   */
  function toArray (list, start) {
    start = start || 0;
    var i = list.length - start;
    var ret = new Array(i);
    while (i--) {
      ret[i] = list[i + start];
    }
    return ret
  }

  /**
   * Mix properties into target object.
   */
  function extend (to, _from) {
    for (var key in _from) {
      to[key] = _from[key];
    }
    return to
  }

  /**
   * Merge an Array of Objects into a single Object.
   */
  function toObject (arr) {
    var res = {};
    for (var i = 0; i < arr.length; i++) {
      if (arr[i]) {
        extend(res, arr[i]);
      }
    }
    return res
  }

  /* eslint-disable no-unused-vars */

  /**
   * Perform no operation.
   * Stubbing args to make Flow happy without leaving useless transpiled code
   * with ...rest (https://flow.org/blog/2017/05/07/Strict-Function-Call-Arity/).
   */
  function noop (a, b, c) {}

  /**
   * Always return false.
   */
  var no = function (a, b, c) { return false; };

  /* eslint-enable no-unused-vars */

  /**
   * Return the same value.
   */
  var identity = function (_) { return _; };

  /**
   * Generate a string containing static keys from compiler modules.
   */
  function genStaticKeys (modules) {
    return modules.reduce(function (keys, m) {
      return keys.concat(m.staticKeys || [])
    }, []).join(',')
  }

  /**
   * Check if two values are loosely equal - that is,
   * if they are plain objects, do they have the same shape?
   */
  function looseEqual (a, b) {
    if (a === b) { return true }
    var isObjectA = isObject(a);
    var isObjectB = isObject(b);
    if (isObjectA && isObjectB) {
      try {
        var isArrayA = Array.isArray(a);
        var isArrayB = Array.isArray(b);
        if (isArrayA && isArrayB) {
          return a.length === b.length && a.every(function (e, i) {
            return looseEqual(e, b[i])
          })
        } else if (a instanceof Date && b instanceof Date) {
          return a.getTime() === b.getTime()
        } else if (!isArrayA && !isArrayB) {
          var keysA = Object.keys(a);
          var keysB = Object.keys(b);
          return keysA.length === keysB.length && keysA.every(function (key) {
            return looseEqual(a[key], b[key])
          })
        } else {
          /* istanbul ignore next */
          return false
        }
      } catch (e) {
        /* istanbul ignore next */
        return false
      }
    } else if (!isObjectA && !isObjectB) {
      return String(a) === String(b)
    } else {
      return false
    }
  }

  /**
   * Return the first index at which a loosely equal value can be
   * found in the array (if value is a plain object, the array must
   * contain an object of the same shape), or -1 if it is not present.
   */
  function looseIndexOf (arr, val) {
    for (var i = 0; i < arr.length; i++) {
      if (looseEqual(arr[i], val)) { return i }
    }
    return -1
  }

  /**
   * Ensure a function is called only once.
   */
  function once (fn) {
    var called = false;
    return function () {
      if (!called) {
        called = true;
        fn.apply(this, arguments);
      }
    }
  }

  var SSR_ATTR = 'data-server-rendered';

  var ASSET_TYPES = [
    'component',
    'directive',
    'filter'
  ];

  var LIFECYCLE_HOOKS = [
    'beforeCreate',
    'created',
    'beforeMount',
    'mounted',
    'beforeUpdate',
    'updated',
    'beforeDestroy',
    'destroyed',
    'activated',
    'deactivated',
    'errorCaptured',
    'serverPrefetch'
  ];

  /*  */



  var config = ({
    /**
     * Option merge strategies (used in core/util/options)
     */
    // $flow-disable-line
    optionMergeStrategies: Object.create(null),

    /**
     * Whether to suppress warnings.
     */
    silent: false,

    /**
     * Show production mode tip message on boot?
     */
    productionTip: "development" !== 'production',

    /**
     * Whether to enable devtools
     */
    devtools: "development" !== 'production',

    /**
     * Whether to record perf
     */
    performance: false,

    /**
     * Error handler for watcher errors
     */
    errorHandler: null,

    /**
     * Warn handler for watcher warns
     */
    warnHandler: null,

    /**
     * Ignore certain custom elements
     */
    ignoredElements: [],

    /**
     * Custom user key aliases for v-on
     */
    // $flow-disable-line
    keyCodes: Object.create(null),

    /**
     * Check if a tag is reserved so that it cannot be registered as a
     * component. This is platform-dependent and may be overwritten.
     */
    isReservedTag: no,

    /**
     * Check if an attribute is reserved so that it cannot be used as a component
     * prop. This is platform-dependent and may be overwritten.
     */
    isReservedAttr: no,

    /**
     * Check if a tag is an unknown element.
     * Platform-dependent.
     */
    isUnknownElement: no,

    /**
     * Get the namespace of an element
     */
    getTagNamespace: noop,

    /**
     * Parse the real tag name for the specific platform.
     */
    parsePlatformTagName: identity,

    /**
     * Check if an attribute must be bound using property, e.g. value
     * Platform-dependent.
     */
    mustUseProp: no,

    /**
     * Perform updates asynchronously. Intended to be used by Vue Test Utils
     * This will significantly reduce performance if set to false.
     */
    async: true,

    /**
     * Exposed for legacy reasons
     */
    _lifecycleHooks: LIFECYCLE_HOOKS
  });

  /*  */

  /**
   * unicode letters used for parsing html tags, component names and property paths.
   * using https://www.w3.org/TR/html53/semantics-scripting.html#potentialcustomelementname
   * skipping \u10000-\uEFFFF due to it freezing up PhantomJS
   */
  // 用于解析 HTML 标签、组件名和路径
  var unicodeRegExp = /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/;

  /**
   * Check if a string starts with $ or _
   */
  function isReserved (str) {
    var c = (str + '').charCodeAt(0);
    // ASCLL 0x24: $; 0x5F: _
    return c === 0x24 || c === 0x5F
  }

  /**
   * Define a property.
   */
  function def (obj, key, val, enumerable) {
    Object.defineProperty(obj, key, {
      value: val,
      enumerable: !!enumerable,
      writable: true,
      configurable: true
    });
  }

  /**
   * Parse simple path.
   */
  var bailRE = new RegExp(("[^" + (unicodeRegExp.source) + ".$_\\d]"));
  function parsePath (path) {
    if (bailRE.test(path)) {
      return
    }
    var segments = path.split('.');
    return function (obj) {
      for (var i = 0; i < segments.length; i++) {
        if (!obj) { return }
        obj = obj[segments[i]];
      }
      return obj
    }
  }

  /*  */

  // can we use __proto__?
  var hasProto = '__proto__' in {};

  // Browser environment sniffing
  var inBrowser = typeof window !== 'undefined';
  var inWeex = typeof WXEnvironment !== 'undefined' && !!WXEnvironment.platform;
  var weexPlatform = inWeex && WXEnvironment.platform.toLowerCase();
  var UA = inBrowser && window.navigator.userAgent.toLowerCase();
  var isIE = UA && /msie|trident/.test(UA);
  var isIE9 = UA && UA.indexOf('msie 9.0') > 0;
  var isEdge = UA && UA.indexOf('edge/') > 0;
  var isAndroid = (UA && UA.indexOf('android') > 0) || (weexPlatform === 'android');
  var isIOS = (UA && /iphone|ipad|ipod|ios/.test(UA)) || (weexPlatform === 'ios');
  var isChrome = UA && /chrome\/\d+/.test(UA) && !isEdge;
  var isPhantomJS = UA && /phantomjs/.test(UA);
  var isFF = UA && UA.match(/firefox\/(\d+)/);

  // Firefox has a "watch" function on Object.prototype...
  var nativeWatch = ({}).watch;

  var supportsPassive = false;
  if (inBrowser) {
    try {
      var opts = {};
      Object.defineProperty(opts, 'passive', ({
        get: function get () {
          /* istanbul ignore next */
          supportsPassive = true;
        }
      })); // https://github.com/facebook/flow/issues/285
      window.addEventListener('test-passive', null, opts);
    } catch (e) {}
  }

  // this needs to be lazy-evaled because vue may be required before
  // vue-server-renderer can set VUE_ENV
  var _isServer;
  // 判断当前运行环境是否是 SSR （服务端渲染），返回一个布尔值
  var isServerRendering = function () {
    if (_isServer === undefined) {
      /* istanbul ignore if */
      if (!inBrowser && !inWeex && typeof global !== 'undefined') {
        // detect presence of vue-server-renderer and avoid
        // Webpack shimming the process
        _isServer = global['process'] && global['process'].env.VUE_ENV === 'server';
      } else {
        _isServer = false;
      }
    }
    return _isServer
  };

  // detect devtools
  var devtools = inBrowser && window.__VUE_DEVTOOLS_GLOBAL_HOOK__;

  /* istanbul ignore next */
  function isNative (Ctor) {
    return typeof Ctor === 'function' && /native code/.test(Ctor.toString())
  }

  var hasSymbol =
    typeof Symbol !== 'undefined' && isNative(Symbol) &&
    typeof Reflect !== 'undefined' && isNative(Reflect.ownKeys);

  var _Set;
  /* istanbul ignore if */ // $flow-disable-line
  if (typeof Set !== 'undefined' && isNative(Set)) {
    // use native Set when available.
    _Set = Set;
  } else {
    // a non-standard Set polyfill that only works with primitive keys.
    _Set = /*@__PURE__*/(function () {
      function Set () {
        this.set = Object.create(null);
      }
      Set.prototype.has = function has (key) {
        return this.set[key] === true
      };
      Set.prototype.add = function add (key) {
        this.set[key] = true;
      };
      Set.prototype.clear = function clear () {
        this.set = Object.create(null);
      };

      return Set;
    }());
  }

  /*  */

  var warn = noop;
  var tip = noop;
  var generateComponentTrace = (noop); // work around flow check
  var formatComponentName = (noop);

  {
    var hasConsole = typeof console !== 'undefined';
    var classifyRE = /(?:^|[-_])(\w)/g;
    var classify = function (str) { return str
      .replace(classifyRE, function (c) { return c.toUpperCase(); })
      .replace(/[-_]/g, ''); };

    warn = function (msg, vm) {
      var trace = vm ? generateComponentTrace(vm) : '';

      if (config.warnHandler) {
        config.warnHandler.call(null, msg, vm, trace);
      } else if (hasConsole && (!config.silent)) {
        console.error(("[Vue warn]: " + msg + trace));
      }
    };

    tip = function (msg, vm) {
      if (hasConsole && (!config.silent)) {
        console.warn("[Vue tip]: " + msg + (
          vm ? generateComponentTrace(vm) : ''
        ));
      }
    };

    formatComponentName = function (vm, includeFile) {
      if (vm.$root === vm) {
        return '<Root>'
      }
      var options = typeof vm === 'function' && vm.cid != null
        ? vm.options
        : vm._isVue
          ? vm.$options || vm.constructor.options
          : vm;
      var name = options.name || options._componentTag;
      var file = options.__file;
      if (!name && file) {
        var match = file.match(/([^/\\]+)\.vue$/);
        name = match && match[1];
      }

      return (
        (name ? ("<" + (classify(name)) + ">") : "<Anonymous>") +
        (file && includeFile !== false ? (" at " + file) : '')
      )
    };

    var repeat = function (str, n) {
      var res = '';
      while (n) {
        if (n % 2 === 1) { res += str; }
        if (n > 1) { str += str; }
        n >>= 1;
      }
      return res
    };

    generateComponentTrace = function (vm) {
      if (vm._isVue && vm.$parent) {
        var tree = [];
        var currentRecursiveSequence = 0;
        while (vm) {
          if (tree.length > 0) {
            var last = tree[tree.length - 1];
            if (last.constructor === vm.constructor) {
              currentRecursiveSequence++;
              vm = vm.$parent;
              continue
            } else if (currentRecursiveSequence > 0) {
              tree[tree.length - 1] = [last, currentRecursiveSequence];
              currentRecursiveSequence = 0;
            }
          }
          tree.push(vm);
          vm = vm.$parent;
        }
        return '\n\nfound in\n\n' + tree
          .map(function (vm, i) { return ("" + (i === 0 ? '---> ' : repeat(' ', 5 + i * 2)) + (Array.isArray(vm)
              ? ((formatComponentName(vm[0])) + "... (" + (vm[1]) + " recursive calls)")
              : formatComponentName(vm))); })
          .join('\n')
      } else {
        return ("\n\n(found in " + (formatComponentName(vm)) + ")")
      }
    };
  }

  /*  */

  var uid = 0;

  /**
   * A dep is an observable that can have multiple
   * directives subscribing to it.
   */
  // 订阅器 / 依赖管理器
  // Dep 实际上是对 Watcher 的一种管理
  // 一个 Dep 对应一个 obj.key
  // 在读取响应式数据时，负责收集依赖，每个 dep（或者说 obi.key）依赖的 watcher 有哪些
  // 响应式数据更新时，负责通知 dep 中那些 watcher 去执行 update 方法
  var Dep = function Dep () {
    // 每个 Dep 都有唯一的 ID
    this.id = uid++;
    // subs 用于存放依赖
    this.subs = [];
  };

  // 在 dep 中添加 watcher
  Dep.prototype.addSub = function addSub (sub) {
    this.subs.push(sub);
  };

  // 移除依赖 sub
  Dep.prototype.removeSub = function removeSub (sub) {
    remove(this.subs, sub);
  };

  // 在 watcher 中添加 dep
  // Dep.target 判断是否是 Watcher 的构造函数调用,判断是 Watcher 的 this.get 调用
  Dep.prototype.depend = function depend () {
    if (Dep.target) {
      Dep.target.addDep(this);
    }
  };

  // 通知 dep 中所有 watcher，执行 watcher.update()
  Dep.prototype.notify = function notify () {
    // stabilize the subscriber list first
    // subs： dep 中收集的 watcher 数组
    // 把 订阅者subs 克隆一份，避免后续操作影响原 订阅者集合subs
    var subs = this.subs.slice();
    if ( !config.async) {
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      subs.sort(function (a, b) { return a.id - b.id; });
    }
    for (var i = 0, l = subs.length; i < l; i++) {
      // 让 watcher 依次执行自己的 update 方法
      subs[i].update();
    }
  };

  // The current target watcher being evaluated.
  // This is globally unique because only one watcher
  // can be evaluated at a time.
  Dep.target = null;
  // 存储被触发收集但未被收集完毕的订阅者；理解为一个栈，保证 Watcher 的收集顺序
  var targetStack = [];

  function pushTarget (target) {
    // 把当前 Watcher 添加到 targetStack 数组中，只有：恢复这个 Watcher
    targetStack.push(target);
    // 当前 Watcher 赋值到 Dep.target，保证同一时间只有一个 Watcher 被收集
    Dep.target = target;
  }

  function popTarget () {
    // 把当前 Watcher 移除 targetStack 数组，说明当前 Watcher 已经收集完毕
    targetStack.pop();
    // 把上一个未被收集的 Watcher 重新赋值给 Dep.target
    Dep.target = targetStack[targetStack.length - 1];
  }

  /*  */

  /**
   * 虚拟 DOM：以 JS 的计算性能来换取操作真实 DOM 所消耗的性能
   * 不同类型的节点本质都是 VNode 类的实例,只是实例化时传入的属性参数不同
   * 注释节点
   * 文本节点
   * 元素节点
   * 组件节点
   * 函数式组件节点
   * 克隆节点
  */
  var VNode = function VNode (
    tag,
    data,
    children,
    text,
    elm,
    context,
    componentOptions,
    asyncFactory
  ) {
    // 当前节点的标签名
    this.tag = tag;
    // 当前节点对应的对象，包含了具体的一些数据信息，是一个 VNodeData 类型
    this.data = data;
    // 当前节点的子节点，是一个数组
    this.children = children;
    // 当前节点的文本
    this.text = text;
    // 当前虚拟节点对应的真实 dom 节点
    this.elm = elm;
    // 当前节点的名字空间
    this.ns = undefined;
    // 当前组件节点对应的 Vue 实例
    this.context = context;
    // 函数式组件对应的 Vue 实例
    this.fnContext = undefined;
    this.fnOptions = undefined;
    this.fnScopeId = undefined;
    // 节点的 key 属性，别当作节点的标志，用于优化
    this.key = data && data.key;
    // 组件的 option 选项
    this.componentOptions = componentOptions;
    // 当前节点对应的组件的实例
    this.componentInstance = undefined;
    // 当前节点的父节点
    this.parent = undefined;
    // 是否为原生 HTML 或 只是普通文本，innerHTML 的时候为 true，textContent 的时候为 false
    this.raw = false;
    // 静态节点标志
    this.isStatic = false;
    // 是否作为根节点插入
    this.isRootInsert = true;
    // 注释节点标志
    this.isComment = false;
    // 克隆节点标志
    this.isCloned = false;
    // 是否有 v-once 指令
    this.isOnce = false;
    this.asyncFactory = asyncFactory;
    this.asyncMeta = undefined;
    this.isAsyncPlaceholder = false;
  };

  var prototypeAccessors = { child: { configurable: true } };

  // DEPRECATED: alias for componentInstance for backwards compat.
  /* istanbul ignore next */
  prototypeAccessors.child.get = function () {
    return this.componentInstance
  };

  Object.defineProperties( VNode.prototype, prototypeAccessors );

  // 注释节点
  var createEmptyVNode = function (text) {
    if ( text === void 0 ) text = '';

    var node = new VNode();
    // 注释的具体信息
    node.text = text;
    // 注释节点的标志
    node.isComment = true;
    return node
  };

  // 文本节点
  function createTextVNode (val) {
    return new VNode(undefined, undefined, undefined, String(val))
  }

  // optimized shallow clone
  // used for static nodes and slot nodes because they may be reused across
  // multiple renders, cloning them avoids errors when DOM manipulations rely
  // on their elm reference.
  // 克隆节点: 把已有节点的属性全部复制到新节点中;先有节点和克隆节点唯一不同: isCloned
  function cloneVNode (vnode) {
    var cloned = new VNode(
      vnode.tag,
      vnode.data,
      // #7975
      // clone children array to avoid mutating original in case of cloning
      // a child.
      vnode.children && vnode.children.slice(),
      vnode.text,
      vnode.elm,
      vnode.context,
      vnode.componentOptions,
      vnode.asyncFactory
    );
    cloned.ns = vnode.ns;
    cloned.isStatic = vnode.isStatic;
    cloned.key = vnode.key;
    cloned.isComment = vnode.isComment;
    cloned.fnContext = vnode.fnContext;
    cloned.fnOptions = vnode.fnOptions;
    cloned.fnScopeId = vnode.fnScopeId;
    cloned.asyncMeta = vnode.asyncMeta;
    cloned.isCloned = true;
    return cloned
  }

  /*
   * not type checking this file because flow doesn't play well with
   * dynamically accessing methods on Array prototype
   */

  // 覆写（增强）数组原型方法，使其具有依赖通知更新的能力
  // 基于数组原型对象创建一个新的对象
  var arrayProto = Array.prototype;
  var arrayMethods = Object.create(arrayProto);

  // 操作数组的七个方法，这七个方法可以改变数组自身
  // 变更方法 （filter、map等不会变更原始数组：替换方法）
  var methodsToPatch = [
    'push',
    'pop',
    'shift',
    'unshift',
    'splice',
    'sort',
    'reverse'
  ];

  /**
   * Intercept mutating methods and emit events
   */
  // 拦截变异方法并触发；函数劫持
  // 遍历七个方法
  methodsToPatch.forEach(function (method) {
    // cache original method
    // 缓存原生方法；以 push 为例，获取 arrayProto.push 的原生方法
    var original = arrayProto[method];
    // 分别在 arrayMethods 对象上定义 七个方法
    // 比如后续执行 arr.push()
    // def 就是 Object.defineProperty，拦截 arrayMethods 的访问
    def(arrayMethods, method, function mutator () {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      // 先执行原生的 push 方法，往数组中放置更新的数据
      var result = original.apply(this, args);
      var ob = this.__ob__;
      // 如果是一下三个之一，说明新插入了元素
      var inserted;
      switch (method) {
        case 'push':
        case 'unshift':
          inserted = args;
          break
        case 'splice':
          // splice 第三个参数才是新增元素
          inserted = args.slice(2);
          break
      }
      // 如果执行的是 push unshift splice 操作的话，进行响应式处理
      if (inserted) { ob.observeArray(inserted); }
      // notify change
      // 执行 dep.notify 方法进行依赖通知更新
      ob.dep.notify();
      return result
    });
  });

  /*  */

  var arrayKeys = Object.getOwnPropertyNames(arrayMethods);

  /**
   * In some cases we may want to disable observation inside a component's
   * update computation.
   */
  // 某些情况下，禁用组件的更新计算   例如：inject 中
  var shouldObserve = true;

  function toggleObserving (value) {
    shouldObserve = value;
  }

  /**
   * Observer class that is attached to each observed
   * object. Once attached, the observer converts the target
   * object's property keys into getter/setters that
   * collect dependencies and dispatch updates.
   */
  // 监听器
  // 观察者类： 会被附加到每个被观察的对象上， value.__ob__ = this
  // 而对象的各个属性则会被转换成 getter/setter，并收集依赖和通知更新
  var Observer = function Observer (value) {
    this.value = value;
    // 实例化一个 dep
    this.dep = new Dep();
    this.vmCount = 0;
    // 把自身的实例对象添加到数据 value 的__ob__ 属性上，使得 value 的__ob__ 属性上保存 Observer 类的一些实例对象和实例方法
    def(value, '__ob__', this);
    if (Array.isArray(value)) {
      // 处理数组响应式
      // 判断是否有 __proto__ 属性，__proto__ 属性是不规划的，有些浏览器没有此属性
      // obj.__proto__访问对象的原型链
      if (hasProto) {
        protoAugment(value, arrayMethods);
      } else {
        copyAugment(value, arrayMethods, arrayKeys);
      }
      this.observeArray(value);
    } else {
      // 处理对象响应式
      this.walk(value);
    }
  };
   
  /**
   * Walk through all properties and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   */
  // 遍历对象上的每个 key，为每个 key 设置响应式
  // 仅当值为对象时才会走到这
  Observer.prototype.walk = function walk (obj) {
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i]);
    }
  };

  /**
   * Observe a list of Array items.
   */
  // 遍历数组的每一项，对其进行观察（响应式处理）
  Observer.prototype.observeArray = function observeArray (items) {
    for (var i = 0, l = items.length; i < l; i++) {
      // 不能直接调用 defineReactive；因为数组元素可以是对象、数组等
      observe(items[i]);
    }
  };

  // helpers

  /**
   * Augment a target Object or Array by intercepting
   * the prototype chain using __proto__
   */
  function protoAugment (target, src) {
    /* eslint-disable no-proto */
    // 用经过增强的数组原型方法，覆盖默认的原型方法，之后再执行那七个数组方法时就具有了依赖通知更新的能力，已达到实现数组响应式能力
    target.__proto__ = src;
    /* eslint-enable no-proto */
  }

  /**
   * Augment a target Object or Array by defining
   * hidden properties.
   */
  // 将增强的那七个方法直接赋值到数组对象上
  /* istanbul ignore next */
  function copyAugment (target, src, keys) {
    for (var i = 0, l = keys.length; i < l; i++) {
      var key = keys[i];
      def(target, key, src[key]);
    }
  }

  /**
   * Attempt to create an observer instance for a value,
   * returns the new observer if successfully observed,
   * or the existing observer if the value already has one.
   */
  // 响应式处理入口
  // 为对象创建观察者实例，如果对象已经被观察过，则返回已有的观察者实例，否则创建新的观察者实例
  // value：被监听的数据； asRootData：true：被监听的数据时根级数据
  function observe (value, asRootData) {
    // 非对象 和 VNode 实例不做响应式处理
    if (!isObject(value) || value instanceof VNode) {
      return
    }
    var ob;
    if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
      // 如果 value 对象上存在 __ob__ 属性且 value.__ob__ 是 Observer 类实例化的对象，则表示已经做过观察了，直接返回 __ob__ 属性，避免重复监听
      ob = value.__ob__;
    } else if (
      shouldObserve &&
      // 非服务端
      !isServerRendering() &&
      // 数组或对象
      (Array.isArray(value) || isPlainObject(value)) &&
      // 可扩展的， Object.freeze() 可冻结对象，使其不可扩展
      Object.isExtensible(value) &&
      // 不是 Vue 实例对象
      !value._isVue
    ) {
      // 实例化 Observer，进行响应式处理
      ob = new Observer(value);
    }
    // 根级数据且 ob 有值
    if (asRootData && ob) {
      ob.vmCount++;
    }
    return ob
  }

  /**
   * 监听对象类型的数据 value 过程，是先把 value 作为参数传入 observe(value) 函数，在其中执行 new Observer(value) ，
   * 然后在 Observer 构造函数中，调用 this.walk 实例方法，
   * 在 this.walk 方法中用 Object.keys() 获取 value 的键集合 keys ，然后遍历 keys 在其中执行 defineReactive(value, keys[i]) ，
   * 在 defineReactive 函数中在 value 自身的属性描述符上定义 get 和 set 属性用来监听，
   * 再通过 value[keys[i]] 获取 value 每个子属性 val ，
   * 如果 val 是对象或数组就会执行 observe(val) 来监听子属性 val，重复开始的流程，这样形成了一个递归调用，
   * 这样数据 value不管本身还是它的所有子属性都会被监听到。
  */
  /**
   * Define a reactive property on an Object.
   */
  /**
   * 拦截 obj[key] 的读取和设置操作
   *  1：在第一次读取时收集依赖，比如执行 render 函数生成虚拟 DOM 时会有读取操作
   *  2：在更新时设置新值并通知依赖更新
  */
  function defineReactive (
    obj,
    key,
    val,
    customSetter,
    shallow
  ) {
    // 实例化一个 dep，一个 key 对应一个 dep
    var dep = new Dep();

    // 获取属性描述符，不可配置（可改变或删除）对象直接 return
    // Object.getOwnPropertyDescriptor() 方法返回指定对象上一个自有属性对应的属性描述符。（自有属性指的是直接赋予该对象的属性，不需要从原型链上进行查找的属性）
    var property = Object.getOwnPropertyDescriptor(obj, key);
    // configurable 属性为 true 时，该对象的属性描述符才能被修改
    if (property && property.configurable === false) {
      return
    }

    // cater for pre-defined getter/setters
    // 记录 getter 和 setter，获取 val 值
    var getter = property && property.get;
    var setter = property && property.set;
    // arguments.length === 2 只要两个参数，没有第三个参数 val
    if ((!getter || setter) && arguments.length === 2) {
      val = obj[key];
    }

    // 通过递归的方式处理 val 为对象的情况，即处理嵌套对象，保证对象中所有 key 都被观察到
    var childOb = !shallow && observe(val);
    // 响应式核心与原理：
    // 读取对象才会进行依赖收集
    // 拦截 obj[key] 的访问和设置
    Object.defineProperty(obj, key, {
      // 可枚举
      enumerable: true,
      // 属性描述符可修改
      configurable: true,
      // 拦截 obj.key，进行依赖收集以及返回最新的值
      get: function reactiveGetter () {
        // obj.key 的值
        var value = getter ? getter.call(obj) : val;
        /**
         * Dep.target 为 Dep 类的一个静态属性，值为 watcher，在实例化 watcher 是会被设置
         * 实例化 Watcher 时会执行 new Watcher 时传递的回调函数（computed 除外，因为懒执行）
         * 回调函数中如果有 vm.key 的读取行为，会触发这里的 读取 拦截，进行依赖收集
         * 回调函数执行完以后会将 Dep.target 设置为 null，避免重复收集依赖
        */
        if (Dep.target) {
          // 读取时进行依赖收集，将 dep 添加到 watcher 中，也将 watcher 添加到 dep 中，双向收集
          dep.depend();
          // childOb 表示对象中嵌套对象的观察者对象，如果存在也对其进行依赖收集
          if (childOb) {
            // 对嵌套对象也进行依赖收集 
            // this.key.childKey 被更新时能触发响应式更新的原因
            childOb.dep.depend();
            if (Array.isArray(value)) {
              // 处理嵌套为数组的情况
              dependArray(value);
            }
          }
        }
        return value
      },
      // 拦截 obj.key =  newVal 的操作
      set: function reactiveSetter (newVal) {
        // 旧值 obj[key]
        var value = getter ? getter.call(obj) : val;
        /* eslint-disable no-self-compare */
        // 如果新老值一样的 则直接 return，不更新不触发响应式更新过程
        // 对象的值可能为 NaN，所以用 newVal !== newVal && value !== value 做下判断
        if (newVal === value || (newVal !== newVal && value !== value)) {
          return
        }
        /* eslint-enable no-self-compare */
        if ( customSetter) {
          customSetter();
        }
        // #7981: for accessor properties without setter
        // setter 不存在，是一个只读属性，直接返回
        if (getter && !setter) { return }
        // 设置新值，替换老值
        if (setter) {
          setter.call(obj, newVal);
        } else {
          val = newVal;
        }
        // 对新值做响应式处理
        childOb = !shallow && observe(newVal);
        // 当响应式数据更新时，做依赖通知更新
        dep.notify();
      }
    });
  }

  /**
   * Set a property on an object. Adds the new property and
   * triggers change notification if the property doesn't
   * already exist.
   */
  /**
   * 通过 Vue.set 或者 this.$set 方法给 target 的指定 key 设置值 val
   * 如果 target 是对象，并且 key 原本不存在，则为新 key 设置响应式，然后执行依赖通知
  */
  function set (target, key, val) {
    if (
    // undefined、null 或 原始类型
      (isUndef(target) || isPrimitive(target))
    ) {
      warn(("Cannot set reactive property on undefined, null, or primitive value: " + ((target))));
    }
    // 处理数组 Vue.set(arr, idx, val)
    // 判断是否是数组，判断参数 key 是否是正确的数组下标
    if (Array.isArray(target) && isValidArrayIndex(key)) {
      // 避免 splice 实例方法中的参数 key 超过数组的长度，而出现只在尾部添加所需的数组元素
      // 确保通过 splice 添加数组元素和通过数组下标添加数组元素的结果一致
      target.length = Math.max(target.length, key);
      // 更新数组指定下标的元素
      // 利用数组的 splice 方法实现的
      target.splice(key, 1, val);
      return val
    }
    // 处理对象已有的属性且不是原型上的属性 对旧值的更新
    if (key in target && !(key in Object.prototype)) {
      target[key] = val;
      return val
    }
    var ob = (target).__ob__;
    // 不能向 Vue 实例或者 $data 动态添加响应式属性，vmCount 的用处之一
    // this.$data 的 ob.vmCount = 1，表示根组件，其他子组件的 vm.vmCount 都是 0
    if (target._isVue || (ob && ob.vmCount)) {
       warn(
        'Avoid adding reactive properties to a Vue instance or its root $data ' +
        'at runtime - declare it upfront in the data option.'
      );
      return val
    }
    // target 不是响应式对象，新属性会被设置，但是不会做响应式处理
    if (!ob) {
      target[key] = val;
      return val
    }
    // 新属性设置 getter、setter，读取时收集依赖，更新时触发依赖通知更新 
    defineReactive(ob.value, key, val);
    // 直接进行依赖通知更新
    ob.dep.notify();
    return val
  }

  /**
   * Delete a property and trigger change if necessary.
   */
  /**
   * 通过 Vue.delete 或者 vm.$delete 删除 target 对象的指定 key
   * 数组通过 splice 方法实现，对象则通过 delete 运算符删除指定 key，并执行依赖通知
  */
  function del (target, key) {
    if (
      (isUndef(target) || isPrimitive(target))
    ) {
      warn(("Cannot delete reactive property on undefined, null, or primitive value: " + ((target))));
    }
    // 数组，利用 splice 方法实现删除元素
    if (Array.isArray(target) && isValidArrayIndex(key)) {
      target.splice(key, 1);
      return
    }
    var ob = (target).__ob__;
    // 避免删除 Vue 实例的属性或者 $date 的数据
    if (target._isVue || (ob && ob.vmCount)) {
       warn(
        'Avoid deleting properties on a Vue instance or its root $data ' +
        '- just set it to null.'
      );
      return
    }
    // 如果属性不存在直接结束
    if (!hasOwn(target, key)) {
      // 没有 key 直接返回
      return
    }
    // 使用 delete 操作符删除属性
    delete target[key];
    // 如没有监听，删除后直接返回
    if (!ob) {
      return 
    }
    // 触发依赖通知更新
    ob.dep.notify();
  }

  /**
   * Collect dependencies on array elements when the array is touched, since
   * we cannot intercept array element access like property getters.
   */
  // 处理数组选项为对象的情况，对其进行依赖收集，因为前面的所有处理都没办法对数组项为对象的元素进行依赖收集
  function dependArray (value) {
    for (var e = (void 0), i = 0, l = value.length; i < l; i++) {
      e = value[i];
      // 有 __ob__ 说明是对象
      e && e.__ob__ && e.__ob__.dep.depend();
      // 数组情况
      if (Array.isArray(e)) {
        dependArray(e);
      }
    }
  }

  /*  */

  /**
   * Option overwriting strategies are functions that handle
   * how to merge a parent option value and a child option
   * value into the final value.
   */
  var strats = config.optionMergeStrategies;

  /**
   * Options with restrictions
   */
  {
    strats.el = strats.propsData = function (parent, child, vm, key) {
      if (!vm) {
        warn(
          "option \"" + key + "\" can only be used during instance " +
          'creation with the `new` keyword.'
        );
      }
      return defaultStrat(parent, child)
    };
  }

  /**
   * Helper that recursively merges two data objects together.
   */
  function mergeData (to, from) {
    if (!from) { return to }
    var key, toVal, fromVal;

    var keys = hasSymbol
      ? Reflect.ownKeys(from)
      : Object.keys(from);

    for (var i = 0; i < keys.length; i++) {
      key = keys[i];
      // in case the object is already observed...
      if (key === '__ob__') { continue }
      toVal = to[key];
      fromVal = from[key];
      if (!hasOwn(to, key)) {
        set(to, key, fromVal);
      } else if (
        toVal !== fromVal &&
        isPlainObject(toVal) &&
        isPlainObject(fromVal)
      ) {
        mergeData(toVal, fromVal);
      }
    }
    return to
  }

  /**
   * Data
   */
  function mergeDataOrFn (
    parentVal,
    childVal,
    vm
  ) {
    if (!vm) {
      // in a Vue.extend merge, both should be functions
      if (!childVal) {
        return parentVal
      }
      if (!parentVal) {
        return childVal
      }
      // when parentVal & childVal are both present,
      // we need to return a function that returns the
      // merged result of both functions... no need to
      // check if parentVal is a function here because
      // it has to be a function to pass previous merges.
      return function mergedDataFn () {
        return mergeData(
          typeof childVal === 'function' ? childVal.call(this, this) : childVal,
          typeof parentVal === 'function' ? parentVal.call(this, this) : parentVal
        )
      }
    } else {
      return function mergedInstanceDataFn () {
        // instance merge
        var instanceData = typeof childVal === 'function'
          ? childVal.call(vm, vm)
          : childVal;
        var defaultData = typeof parentVal === 'function'
          ? parentVal.call(vm, vm)
          : parentVal;
        if (instanceData) {
          return mergeData(instanceData, defaultData)
        } else {
          return defaultData
        }
      }
    }
  }

  strats.data = function (
    parentVal,
    childVal,
    vm
  ) {
    if (!vm) {
      if (childVal && typeof childVal !== 'function') {
         warn(
          'The "data" option should be a function ' +
          'that returns a per-instance value in component ' +
          'definitions.',
          vm
        );

        return parentVal
      }
      return mergeDataOrFn(parentVal, childVal)
    }

    return mergeDataOrFn(parentVal, childVal, vm)
  };

  /**
   * Hooks and props are merged as arrays.
   */
  function mergeHook (
    parentVal,
    childVal
  ) {
    var res = childVal
      ? parentVal
        ? parentVal.concat(childVal)
        : Array.isArray(childVal)
          ? childVal
          : [childVal]
      : parentVal;
    return res
      ? dedupeHooks(res)
      : res
  }

  function dedupeHooks (hooks) {
    var res = [];
    for (var i = 0; i < hooks.length; i++) {
      if (res.indexOf(hooks[i]) === -1) {
        res.push(hooks[i]);
      }
    }
    return res
  }

  LIFECYCLE_HOOKS.forEach(function (hook) {
    strats[hook] = mergeHook;
  });

  /**
   * Assets
   *
   * When a vm is present (instance creation), we need to do
   * a three-way merge between constructor options, instance
   * options and parent options.
   */
  function mergeAssets (
    parentVal,
    childVal,
    vm,
    key
  ) {
    var res = Object.create(parentVal || null);
    if (childVal) {
       assertObjectType(key, childVal, vm);
      return extend(res, childVal)
    } else {
      return res
    }
  }

  ASSET_TYPES.forEach(function (type) {
    strats[type + 's'] = mergeAssets;
  });

  /**
   * Watchers.
   *
   * Watchers hashes should not overwrite one
   * another, so we merge them as arrays.
   */
  strats.watch = function (
    parentVal,
    childVal,
    vm,
    key
  ) {
    // work around Firefox's Object.prototype.watch...
    if (parentVal === nativeWatch) { parentVal = undefined; }
    if (childVal === nativeWatch) { childVal = undefined; }
    /* istanbul ignore if */
    if (!childVal) { return Object.create(parentVal || null) }
    {
      assertObjectType(key, childVal, vm);
    }
    if (!parentVal) { return childVal }
    var ret = {};
    extend(ret, parentVal);
    for (var key$1 in childVal) {
      var parent = ret[key$1];
      var child = childVal[key$1];
      if (parent && !Array.isArray(parent)) {
        parent = [parent];
      }
      ret[key$1] = parent
        ? parent.concat(child)
        : Array.isArray(child) ? child : [child];
    }
    return ret
  };

  /**
   * Other object hashes.
   */
  strats.props =
  strats.methods =
  strats.inject =
  strats.computed = function (
    parentVal,
    childVal,
    vm,
    key
  ) {
    if (childVal && "development" !== 'production') {
      assertObjectType(key, childVal, vm);
    }
    if (!parentVal) { return childVal }
    var ret = Object.create(null);
    extend(ret, parentVal);
    if (childVal) { extend(ret, childVal); }
    return ret
  };
  strats.provide = mergeDataOrFn;

  /**
   * Default strategy.
   */
  var defaultStrat = function (parentVal, childVal) {
    return childVal === undefined
      ? parentVal
      : childVal
  };

  /**
   * Validate component names
   */
  function checkComponents (options) {
    for (var key in options.components) {
      validateComponentName(key);
    }
  }

  function validateComponentName (name) {
    if (!new RegExp(("^[a-zA-Z][\\-\\.0-9_" + (unicodeRegExp.source) + "]*$")).test(name)) {
      warn(
        'Invalid component name: "' + name + '". Component names ' +
        'should conform to valid custom element name in html5 specification.'
      );
    }
    if (isBuiltInTag(name) || config.isReservedTag(name)) {
      warn(
        'Do not use built-in or reserved HTML elements as component ' +
        'id: ' + name
      );
    }
  }

  /**
   * Ensure all props option syntax are normalized into the
   * Object-based format.
   */
  // 规格化 props 为对象的格式 （可以通过数组指定需要哪些属性，但数组格式的 props 规格化成对象格式）
  function normalizeProps (options, vm) {
    var props = options.props;
    // 判断是否有 props 属性；没有则直接返回
    if (!props) { return }
    // 保存规格化后的结果
    var res = {};
    var i, val, name;
    if (Array.isArray(props)) {
      // 数组 将 Array 类型的 props 规格化为 Object 类型
      i = props.length;
      while (i--) {
        val = props[i];
        if (typeof val === 'string') {
          // 将其 驼峰化
          name = camelize(val);
          // 将 props 当做属性,设置到 res 中
          res[name] = { type: null };
        } else {
          warn('props must be strings when using array syntax.');
        }
      }
    } else if (isPlainObject(props)) {
      // 对象
      // isPlainObject: 判断是否是对象
      for (var key in props) {
        val = props[key];
        name = camelize(key);
        // { propA: { type: Sting, default: '', required: true }  }
        // propB: String
        // propC: [Sting, Number]
        res[name] = isPlainObject(val)
          ? val
          : { type: val };
      }
    } else {
      // 都不是 则警告
      warn(
        "Invalid value for option \"props\": expected an Array or an Object, " +
        "but got " + (toRawType(props)) + ".",
        vm
      );
    }
    options.props = res;
  }

  /**
   * Normalize all injections into Object-based format
   */
  // 格式化 inject 为对象的格式
  function normalizeInject (options, vm) {
    var inject = options.inject;
    // 没有 直接返回
    if (!inject) { return }
    /**
     * inject: ['injectA']
     * inject: { injectB: { default: 'xxx' } }
     * inject: { injectC }
     * 统一转换成：
     * inject： {
     *    injectD: {
     *         from: 'xxx',
     *         default: 'xxx'   // 如果有默认值
     *      }
     * }
    */
    var normalized = options.inject = {};
    // 数组
    if (Array.isArray(inject)) {
      for (var i = 0; i < inject.length; i++) {
        normalized[inject[i]] = { from: inject[i] };
      }
    } else if (isPlainObject(inject)) {
      // 对象
      for (var key in inject) {
        var val = inject[key];
        normalized[key] = isPlainObject(val)
          ? extend({ from: key }, val)
          : { from: val };
      }
    } else {
      warn(
        "Invalid value for option \"inject\": expected an Array or an Object, " +
        "but got " + (toRawType(inject)) + ".",
        vm
      );
    }
  }

  /**
   * Normalize raw function directives into object format.
   */
  function normalizeDirectives (options) {
    var dirs = options.directives;
    if (dirs) {
      for (var key in dirs) {
        var def = dirs[key];
        if (typeof def === 'function') {
          dirs[key] = { bind: def, update: def };
        }
      }
    }
  }

  function assertObjectType (name, value, vm) {
    if (!isPlainObject(value)) {
      warn(
        "Invalid value for option \"" + name + "\": expected an Object, " +
        "but got " + (toRawType(value)) + ".",
        vm
      );
    }
  }

  /**
   * Merge two option objects into a new one.
   * Core utility used in both instantiation and inheritance.
   */
  // 合并两个选项，出现相同配置选项时，子选项会覆盖父选项的配置
  function mergeOptions (
    parent,
    child,
    vm
  ) {
    {
      checkComponents(child);
    }

    if (typeof child === 'function') {
      child = child.options;
    }

    // 选项的标准化处理 props、inject、directive等
    normalizeProps(child, vm);
    normalizeInject(child, vm);
    normalizeDirectives(child);

    // Apply extends and mixins on the child options,
    // but only if it is a raw options object that isn't
    // the result of another mergeOptions call.
    // Only merged options has the _base property.
    // 处理原始 child 对象上的 extends 和 mixins，分别执行 mergeOptions，将这些继承而来的选项合并到 parent
    // 递归合并选项
    if (!child._base) {
      // { extends }，类似 mixin，基于一个组件扩展另一个，不需要使用 Vue.extend
      if (child.extends) {
        parent = mergeOptions(parent, child.extends, vm);
      }
      if (child.mixins) {
        for (var i = 0, l = child.mixins.length; i < l; i++) {
          parent = mergeOptions(parent, child.mixins[i], vm);
        }
      }
    }

    // 最后 return 的结果
    var options = {};
    var key;
    // 遍历 父选项
    for (key in parent) {
      mergeField(key);
    }
    // 遍历子选项，如果父选项不存在该配置，则合并，因为父子拥有同一个属性的情况在上面处理父选项时已经处理过了，用的子选项的值
    for (key in child) {
      if (!hasOwn(parent, key)) {
        mergeField(key);
      }
    }

    // 选项合并，childVal 优先级高于 parentVal
    function mergeField (key) {
      // 选项合并策略方法
      var strat = strats[key] || defaultStrat;
      // child 覆盖 parent
      options[key] = strat(parent[key], child[key], vm, key);
    }
    return options
  }

  /**
   * Resolve an asset.
   * This function is used because child instances need access
   * to assets defined in its ancestor chain.
   */
  function resolveAsset (
    // 当前实例 $options
    options,
    // 过滤器、组件、指令
    type,
    id,
    warnMissing
  ) {
    /* istanbul ignore if */
    // 参数 id，必须是字符串类型
    if (typeof id !== 'string') {
      return
    }
    // 获取当前实例中 所有的 type
    var assets = options[type];
    // check local registration variations first
    // 先检查本地注册的变动
    // 检查自身是否存在
    if (hasOwn(assets, id)) { return assets[id] }
    // 驼峰化 再检查自身字符存在
    var camelizedId = camelize(id);
    if (hasOwn(assets, camelizedId)) { return assets[camelizedId] }
    // 将 id 首字母大写 之后再检查
    var PascalCaseId = capitalize(camelizedId);
    if (hasOwn(assets, PascalCaseId)) { return assets[PascalCaseId] }
    // fallback to prototype chain
    // 检查原型链
    var res = assets[id] || assets[camelizedId] || assets[PascalCaseId];
    if ( warnMissing && !res) {
      warn(
        'Failed to resolve ' + type.slice(0, -1) + ': ' + id,
        options
      );
    }
    return res
  }

  /*  */



  function validateProp (
    // key: propOptions中的属性名
    key,
    // 子组件用户设置的 props 选项
    propOptions,
    // 父组件或用户提供的 props 数据
    propsData,
    vm
  ) {
    // 当前 key 在 propOptions 中对应的值
    var prop = propOptions[key];
    // 当前 key 在用户提供的 props 选项中是否存在，即父组件是否传入该属性
    var absent = !hasOwn(propsData, key);
    // 使用当前 key 在用户提供的 props 数据选项中获取的数据，即父组件对于该属性传入的真实值
    var value = propsData[key];
    // boolean casting
    // 判断是否存在 Boolean 类型
    var booleanIndex = getTypeIndex(Boolean, prop.type);
    if (booleanIndex > -1) {
      // 处理布尔类型的 props
      if (absent && !hasOwn(prop, 'default')) {
        // 不存在即父组件没有传入，没有设置默认值 则置为 false
        value = false;
      } else if (value === '' || value === hyphenate(key)) {
        // hyphenate 函数 将 key 进行驼峰转换
        // 都会置为 true
        // <Child name></Child>
        // <Child name="name"></Child>
        // <Child userName="user-name"></Child>
        // only cast empty string / same name to boolean if
        // boolean has higher priority
        var stringIndex = getTypeIndex(String, prop.type);
        // 不存在 String 类型 或 Boolean 类型 优先级高于 String
        if (stringIndex < 0 || booleanIndex < stringIndex) {
          value = true;
        }
      }
    }
    // check default value
    // 如果不是 Boolean 类型，只需要判断父组件是否传入该属；没有，则用调用默认值，并将其转成响应式
    // 检查默认值
    if (value === undefined) {
      // 获取 prop 的默认值
      value = getPropDefaultValue(vm, prop, key);
      // since the default value is a fresh copy,
      // make sure to observe it.
      // 默认数据是新的数据，所以需要转成响应式的
      var prevShouldObserve = shouldObserve;
      // 决定 observe 被调用时，是否会将 value 转换成响应式的
      toggleObserving(true);
      // 获取默认值转换成响应式的
      observe(value);
      // 恢复成最初的状态
      toggleObserving(prevShouldObserve);
    }
    {
      // 校验属性值是否与要求的类型匹配
      assertProp(prop, key, value, vm, absent);
    }
    // 返回真实值
    return value
  }

  /**
   * Get the default value of a prop.
   */
  // 子组件 props 选项中的 key 获取其对应的默认值
  function getPropDefaultValue (vm, prop, key) {
    // no default, return undefined
    if (!hasOwn(prop, 'default')) {
      return undefined
    }
    var def = prop.default;
    // warn against non-factory defaults for Object & Array
    // 如果是对象，则抛出警告：对象或数组默认值必须从工厂函数获取
    if ( isObject(def)) {
      warn(
        'Invalid default value for prop "' + key + '": ' +
        'Props with type Object/Array must use a factory function ' +
        'to return the default value.',
        vm
      );
    }
    // the raw prop value was also undefined from previous render,
    // return previous default value to avoid unnecessary watcher trigger
    // 父组件没有该属性，但 vm._props 中有该属性
    if (vm && vm.$options.propsData &&
      vm.$options.propsData[key] === undefined &&
      vm._props[key] !== undefined
    ) {
      return vm._props[key]
    }
    // call factory function for non-Function types
    // a value is Function if its prototype is function even across different execution context
    return typeof def === 'function' && getType(prop.type) !== 'Function'
      ? def.call(vm)
      : def
  }

  /**
   * Assert whether a prop is valid.
   */
  // 校验父组件传入真实的值与 prop 选项中 type 类型匹配
  function assertProp (
    // prop 选项
    prop,
    // prop 选项中的 key
    name,
    // 父组件传入的真实数据
    value,
    // 当前实力
    vm,
    // 父组件是否传入该属性
    absent
  ) {
    if (prop.required && absent) {
      // 先处理必填项 prop数据中没有传
      warn(
        'Missing required prop: "' + name + '"',
        vm
      );
      return
    }
    if (value == null && !prop.required) {
      // 不存在的情况  注意: 使用的 == ;null 或 undefined 都为 true
      return
    }
    // 校验的类型
    var type = prop.type;
    // 是否校验成功  没有设置 type 默认为 true
    // type === true :为防止 props:{propA: true} 的情况：一定会校验成功
    var valid = !type || type === true;
    // 保存 type 的列表,校验失败,在控制台打印保存的类型警告
    var expectedTypes = [];
    if (type) {
      if (!Array.isArray(type)) {
        // 不是数组，转成数组
        type = [type];
      }
      // !valid 重点： type 列表中只要有一个校验成功，循环就结束了
      for (var i = 0; i < type.length && !valid; i++) {
        var assertedType = assertType(value, type[i], vm);
        expectedTypes.push(assertedType.expectedType || '');
        valid = assertedType.valid;
      }
    }

    var haveExpectedTypes = expectedTypes.some(function (t) { return t; });
    if (!valid && haveExpectedTypes) {
      warn(
        getInvalidTypeMessage(name, value, expectedTypes),
        vm
      );
      return
    }
    var validator = prop.validator;
    // prop 支持自定义函数，最后自定义验证函数
    if (validator) {
      if (!validator(value)) {
        warn(
          'Invalid prop: custom validator check failed for prop "' + name + '".',
          vm
        );
      }
    }
  }

  var simpleCheckRE = /^(String|Number|Boolean|Function|Symbol|BigInt)$/;

  // 校验后返回一个对象  是否校验成功和类型
  function assertType (value, type, vm) {
    var valid;
    var expectedType = getType(type);
    if (simpleCheckRE.test(expectedType)) {
      var t = typeof value;
      valid = t === expectedType.toLowerCase();
      // for primitive wrapper objects
      if (!valid && t === 'object') {
        valid = value instanceof type;
      }
    } else if (expectedType === 'Object') {
      valid = isPlainObject(value);
    } else if (expectedType === 'Array') {
      valid = Array.isArray(value);
    } else {
      try {
        valid = value instanceof type;
      } catch (e) {
        warn('Invalid prop type: "' + String(type) + '" is not a constructor', vm);
        valid = false;
      }
    }
    return {
      valid: valid,
      expectedType: expectedType
    }
  }

  var functionTypeCheckRE = /^\s*function (\w+)/;

  /**
   * Use function string name to check built-in types,
   * because a simple equality check will fail when running
   * across different vms / iframes.
   */
  function getType (fn) {
    var match = fn && fn.toString().match(functionTypeCheckRE);
    return match ? match[1] : ''
  }

  function isSameType (a, b) {
    return getType(a) === getType(b)
  }

  // 获取对应类型的索引
  function getTypeIndex (type, expectedTypes) {
    if (!Array.isArray(expectedTypes)) {
      return isSameType(expectedTypes, type) ? 0 : -1
    }
    for (var i = 0, len = expectedTypes.length; i < len; i++) {
      if (isSameType(expectedTypes[i], type)) {
        return i
      }
    }
    return -1
  }

  function getInvalidTypeMessage (name, value, expectedTypes) {
    var message = "Invalid prop: type check failed for prop \"" + name + "\"." +
      " Expected " + (expectedTypes.map(capitalize).join(', '));
    var expectedType = expectedTypes[0];
    var receivedType = toRawType(value);
    // check if we need to specify expected value
    if (
      expectedTypes.length === 1 &&
      isExplicable(expectedType) &&
      isExplicable(typeof value) &&
      !isBoolean(expectedType, receivedType)
    ) {
      message += " with value " + (styleValue(value, expectedType));
    }
    message += ", got " + receivedType + " ";
    // check if we need to specify received value
    if (isExplicable(receivedType)) {
      message += "with value " + (styleValue(value, receivedType)) + ".";
    }
    return message
  }

  function styleValue (value, type) {
    if (type === 'String') {
      return ("\"" + value + "\"")
    } else if (type === 'Number') {
      return ("" + (Number(value)))
    } else {
      return ("" + value)
    }
  }

  var EXPLICABLE_TYPES = ['string', 'number', 'boolean'];
  function isExplicable (value) {
    return EXPLICABLE_TYPES.some(function (elem) { return value.toLowerCase() === elem; })
  }

  function isBoolean () {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return args.some(function (elem) { return elem.toLowerCase() === 'boolean'; })
  }

  /*  */

  function handleError (err, vm, info) {
    // Deactivate deps tracking while processing error handler to avoid possible infinite rendering.
    // See: https://github.com/vuejs/vuex/issues/1505
    pushTarget();
    try {
      if (vm) {
        var cur = vm;
        while ((cur = cur.$parent)) {
          var hooks = cur.$options.errorCaptured;
          if (hooks) {
            for (var i = 0; i < hooks.length; i++) {
              try {
                var capture = hooks[i].call(cur, err, vm, info) === false;
                if (capture) { return }
              } catch (e) {
                globalHandleError(e, cur, 'errorCaptured hook');
              }
            }
          }
        }
      }
      globalHandleError(err, vm, info);
    } finally {
      popTarget();
    }
  }

  /**
   * 通用函数，执行指定函数 handler
   * 传递进来的函数，会用 try catch 包裹，进行异常捕获
  */
  function invokeWithErrorHandling (
    // 回调函数
    handler,
    // 上下文 this
    context,
    // 传递的参数
    args,
    // 上下文 this
    vm,
    // 提示信息111 222
    info
  ) {
    var res;
    try {
      // 执行生命周期函数
      // 执行传递进来的函数 handler，并将执行结果返回
      res = args ? handler.apply(context, args) : handler.call(context);
      if (res && !res._isVue && isPromise(res) && !res._handled) {
        res.catch(function (e) { return handleError(e, vm, info + " (Promise/async)"); });
        // issue #9511
        // avoid catch triggering multiple times when nested calls
        res._handled = true;
      }
    } catch (e) {
      handleError(e, vm, info);
    }
    return res
  }

  function globalHandleError (err, vm, info) {
    if (config.errorHandler) {
      try {
        return config.errorHandler.call(null, err, vm, info)
      } catch (e) {
        // if the user intentionally throws the original error in the handler,
        // do not log it twice
        if (e !== err) {
          logError(e, null, 'config.errorHandler');
        }
      }
    }
    logError(err, vm, info);
  }

  function logError (err, vm, info) {
    {
      warn(("Error in " + info + ": \"" + (err.toString()) + "\""), vm);
    }
    /* istanbul ignore else */
    if ((inBrowser || inWeex) && typeof console !== 'undefined') {
      console.error(err);
    } else {
      throw err
    }
  }

  /*  */

  var isUsingMicroTask = false;

  // 回调队列
  var callbacks = [];
  // 异步锁
  var pending = false;

  /**
   * 1.将 pending 再次置为 false，表示下一个 flushCallbacks 函数可以进入浏览器的异步队列任务
   * 2.清空 callbacks 数组
   * 3.执行 callbacks 数组中的所有函数 
   *        flushSchedulerQueue
   *        用户自己调用 this.$nextTick 传递的函数
   */
  function flushCallbacks () {
    // 微任务队列中，只会存在一个 flushCallbacks 函数
    // 置为 false；使下个事件循环中能 nextTick 函数中调用 timerFunc 函数
    pending = false;
    // 相当于 深拷贝
    var copies = callbacks.slice(0);
    // 清空 callbacks
    callbacks.length = 0;
    // 遍历 callbacks 数组,执行其中存储的每个 flushSchedulerQueue 函数
    for (var i = 0; i < copies.length; i++) {
      copies[i]();
    }
  }

  // microtasks： 微任务； macro： 宏任务
  // Here we have async deferring wrappers using microtasks.
  // In 2.5 we used (macro) tasks (in combination with microtasks).
  // However, it has subtle problems when state is changed right before repaint
  // (e.g. #6813, out-in transitions).
  // Also, using (macro) tasks in event handler would cause some weird behaviors
  // that cannot be circumvented (e.g. #7109, #7153, #7546, #7834, #8109).
  // So we now use microtasks everywhere, again.
  // A major drawback of this tradeoff is that there are some scenarios
  // where microtasks have too high a priority and fire in between supposedly
  // sequential events (e.g. #4521, #6690, which have workarounds)
  // or even between bubbling of the same event (#6566).
  // 将 flushCallbacks 函数放入浏览器的异步任务队列中
  var timerFunc;

  // The nextTick behavior leverages the microtask queue, which can be accessed
  // via either native Promise.then or MutationObserver.
  // MutationObserver has wider support, however it is seriously bugged in
  // UIWebView in iOS >= 9.3.3 when triggered in touch event handlers. It
  // completely stops working after triggering a few times... so, if native
  // Promise is available, we will use it:
  /* istanbul ignore next, $flow-disable-line */
  // 优雅降级处理
  if (typeof Promise !== 'undefined' && isNative(Promise)) {
    var p = Promise.resolve();
    // 首选 Promise.resolve().then()
    timerFunc = function () {
      // 在微任务队列 中放入 flushCallbacks 函数
      p.then(flushCallbacks);
      // In problematic UIWebViews, Promise.then doesn't completely break, but
      // it can get stuck in a weird state where callbacks are pushed into the
      // microtask queue but the queue isn't being flushed, until the browser
      // needs to do some other work, e.g. handle a timer. Therefore we can
      // "force" the microtask queue to be flushed by adding an empty timer.
      /**
       * 在有问题的 UIWebViews 中，Promise.then 不会完全中断，但是它可能会陷入奇异的状态
       * 在这种状态下，回调被推入微任务队列，但队列没有刷新，知道浏览器需要执行其他工作。例如处理一个定时器
       * 因此，通过添加空定时器来 强制 刷新微任务队列
      */
      if (isIOS) { setTimeout(noop); }
    };
    isUsingMicroTask = true;
  } else if (!isIE && typeof MutationObserver !== 'undefined' && (
    isNative(MutationObserver) ||
    // PhantomJS and iOS 7.x
    MutationObserver.toString() === '[object MutationObserverConstructor]'
  )) {
    // MutationObserver 次之
    // Use MutationObserver where native Promise is not available,
    // e.g. PhantomJS, iOS7, Android 4.4
    // (#6466 MutationObserver is unreliable in IE11)
    var counter = 1;
    // 创建新的 MutationObserver
    var observer = new MutationObserver(flushCallbacks);
    // 参加文本节点
    var textNode = document.createTextNode(String(counter));
    // 监听文本节点内容
    observer.observe(textNode, {
      characterData: true
    });
    timerFunc = function () {
      counter = (counter + 1) % 2;
      textNode.data = String(counter);
    };
    isUsingMicroTask = true;
  } else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
    // setImmediate 宏任务
    // 兼容 IE10 以上浏览器
    // Fallback to setImmediate.
    // Technically it leverages the (macro) task queue,
    // but it is still a better choice than setTimeout.
    timerFunc = function () {
      setImmediate(flushCallbacks);
    };
  } else {
    // 最后 setTimeout
    // 兼容 IE10 以下浏览器
    // Fallback to setTimeout.
    timerFunc = function () {
      setTimeout(flushCallbacks, 0);
    };
  }

  /**
   * 1：用 try catch 包装 flushSchedulerQueue 函数，然后将其放入 callbacks 数组
   * 2: 如果 pending 为 false，表示现在浏览器的任务队列中没有 flushCallbacks 函数
   *    如果 pending 为 true，则表示浏览器的任务队列中已经放入 flushCallbacks 函数
   *    待执行 flushCallbacks 函数时，pending 会再次置为 false，表示下一个 flushCallbacks 函数可以进入浏览器的任务队列
   * pending 的作用： 保证同一时刻，浏览器的任务队列中只有一个 flushCallbacks 函数
   * @param {*} cb 接受一个回调函数 => flushSchedulerQueue 函数
   * @param {*} ctx 上下文
   * @returns 
   */
  function nextTick (cb, ctx) {
    var _resolve;
    // 将 nextTick 的回调函数用 try catch 包装一层，方便异常捕获
    // 然后将 包装后的函数 放到这个 callback 数组 （将回调函数推入回调队列）
    callbacks.push(function () {
      if (cb) {
        // 方便错误捕获
        try {
          cb.call(ctx);
        } catch (e) {
          handleError(e, ctx, 'nextTick');
        }
      } else if (_resolve) {
        _resolve(ctx);
      }
    });
    if (!pending) {
      // pending 为 false，没有 flushCallbacks 函数，执行 timeFunc 函数
      pending = true;
      // 在浏览器的任务队列中（首选微任务队列）放入 flushCallbacks 函数
      timerFunc();
    }
    // $flow-disable-line
    // 没有提供回调，并支持 Promise，返回一个 Promise
    if (!cb && typeof Promise !== 'undefined') {
      return new Promise(function (resolve) {
        _resolve = resolve;
      })
    }
  }

  var mark;
  var measure;

  {
    var perf = inBrowser && window.performance;
    /* istanbul ignore if */
    if (
      perf &&
      perf.mark &&
      perf.measure &&
      perf.clearMarks &&
      perf.clearMeasures
    ) {
      mark = function (tag) { return perf.mark(tag); };
      measure = function (name, startTag, endTag) {
        perf.measure(name, startTag, endTag);
        perf.clearMarks(startTag);
        perf.clearMarks(endTag);
        // perf.clearMeasures(name)
      };
    }
  }

  /* not type checking this file because flow doesn't play well with Proxy */

  var initProxy;

  {
    var allowedGlobals = makeMap(
      'Infinity,undefined,NaN,isFinite,isNaN,' +
      'parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,' +
      'Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,BigInt,' +
      'require' // for Webpack/Browserify
    );

    var warnNonPresent = function (target, key) {
      warn(
        "Property or method \"" + key + "\" is not defined on the instance but " +
        'referenced during render. Make sure that this property is reactive, ' +
        'either in the data option, or for class-based components, by ' +
        'initializing the property. ' +
        'See: https://vuejs.org/v2/guide/reactivity.html#Declaring-Reactive-Properties.',
        target
      );
    };

    var warnReservedPrefix = function (target, key) {
      warn(
        "Property \"" + key + "\" must be accessed with \"$data." + key + "\" because " +
        'properties starting with "$" or "_" are not proxied in the Vue instance to ' +
        'prevent conflicts with Vue internals. ' +
        'See: https://vuejs.org/v2/api/#data',
        target
      );
    };

    var hasProxy =
      typeof Proxy !== 'undefined' && isNative(Proxy);

    if (hasProxy) {
      var isBuiltInModifier = makeMap('stop,prevent,self,ctrl,shift,alt,meta,exact');
      config.keyCodes = new Proxy(config.keyCodes, {
        set: function set (target, key, value) {
          if (isBuiltInModifier(key)) {
            warn(("Avoid overwriting built-in modifier in config.keyCodes: ." + key));
            return false
          } else {
            target[key] = value;
            return true
          }
        }
      });
    }

    var hasHandler = {
      has: function has (target, key) {
        var has = key in target;
        var isAllowed = allowedGlobals(key) ||
          (typeof key === 'string' && key.charAt(0) === '_' && !(key in target.$data));
        if (!has && !isAllowed) {
          if (key in target.$data) { warnReservedPrefix(target, key); }
          else { warnNonPresent(target, key); }
        }
        return has || !isAllowed
      }
    };

    var getHandler = {
      get: function get (target, key) {
        if (typeof key === 'string' && !(key in target)) {
          if (key in target.$data) { warnReservedPrefix(target, key); }
          else { warnNonPresent(target, key); }
        }
        return target[key]
      }
    };

    initProxy = function initProxy (vm) {
      if (hasProxy) {
        // determine which proxy handler to use
        var options = vm.$options;
        var handlers = options.render && options.render._withStripped
          ? getHandler
          : hasHandler;
        vm._renderProxy = new Proxy(vm, handlers);
      } else {
        vm._renderProxy = vm;
      }
    };
  }

  /*  */

  // 天然的去重效果，避免重复收集依赖
  var seenObjects = new _Set();

  /**
   * Recursively traverse an object to evoke all converted
   * getters, so that every nested property inside the object
   * is collected as a "deep" dependency.
   */
  // 创建watcher实例的时候把obj对象内部所有的值都递归的读一遍，
  // 那么这个watcher实例就会被加入到对象内所有值的依赖列表中，
  // 之后当对象内任意某个值发生变化时就能够得到通知了。
  function traverse (val) {
    _traverse(val, seenObjects);
    seenObjects.clear();
  }

  function _traverse (val, seen) {
    var i, keys;
    var isA = Array.isArray(val);
    // 不是数组、对象，被冻结的对象，VNode类实例化对象
    if ((!isA && !isObject(val)) || Object.isFrozen(val) || val instanceof VNode) {
      return
    }
    // 被监听过
    if (val.__ob__) {
      // 获取 Dep 的标识 id
      var depId = val.__ob__.dep.id;
      // 避免重复遍历子对象触发收集订阅者
      if (seen.has(depId)) {
        return
      }
      seen.add(depId);
    }
    if (isA) {
      // 数组
      i = val.length;
      // 递归
      while (i--) { _traverse(val[i], seen); }
    } else {
      keys = Object.keys(val);
      i = keys.length;
      while (i--) { _traverse(val[keys[i]], seen); }
    }
  }

  /*  */

  var normalizeEvent = cached(function (name) {
    var passive = name.charAt(0) === '&';
    name = passive ? name.slice(1) : name;
    var once = name.charAt(0) === '~'; // Prefixed last, checked first
    name = once ? name.slice(1) : name;
    var capture = name.charAt(0) === '!';
    name = capture ? name.slice(1) : name;
    return {
      name: name,
      once: once,
      capture: capture,
      passive: passive
    }
  });

  function createFnInvoker (fns, vm) {
    function invoker () {
      var arguments$1 = arguments;

      var fns = invoker.fns;
      if (Array.isArray(fns)) {
        var cloned = fns.slice();
        for (var i = 0; i < cloned.length; i++) {
          invokeWithErrorHandling(cloned[i], null, arguments$1, vm, "v-on handler");
        }
      } else {
        // return handler return value for single handlers
        return invokeWithErrorHandling(fns, null, arguments, vm, "v-on handler")
      }
    }
    invoker.fns = fns;
    return invoker
  }

  function updateListeners (
    on,
    oldOn,
    // 注册事件
    add,
    // 卸载事件
    remove,
    createOnceHandler,
    vm
  ) {
    var name, def, cur, old, event;
    // 对其遍历
    for (name in on) {
      // 获取事件名
      def = cur = on[name];
      old = oldOn[name];
      event = normalizeEvent(name);
      if (isUndef(cur)) {
         warn(
          "Invalid handler for event \"" + (event.name) + "\": got " + String(cur),
          vm
        );
      } else if (isUndef(old)) {
        if (isUndef(cur.fns)) {
          cur = on[name] = createFnInvoker(cur, vm);
        }
        if (isTrue(event.once)) {
          cur = on[name] = createOnceHandler(event.name, cur, event.capture);
        }
        add(event.name, cur, event.capture, event.passive, event.params);
      } else if (cur !== old) {
        old.fns = cur;
        on[name] = old;
      }
    }
    for (name in oldOn) {
      if (isUndef(on[name])) {
        event = normalizeEvent(name);
        remove(event.name, oldOn[name], event.capture);
      }
    }
  }

  /*  */

  function mergeVNodeHook (def, hookKey, hook) {
    if (def instanceof VNode) {
      def = def.data.hook || (def.data.hook = {});
    }
    var invoker;
    var oldHook = def[hookKey];

    function wrappedHook () {
      hook.apply(this, arguments);
      // important: remove merged hook to ensure it's called only once
      // and prevent memory leak
      remove(invoker.fns, wrappedHook);
    }

    if (isUndef(oldHook)) {
      // no existing hook
      invoker = createFnInvoker([wrappedHook]);
    } else {
      /* istanbul ignore if */
      if (isDef(oldHook.fns) && isTrue(oldHook.merged)) {
        // already a merged invoker
        invoker = oldHook;
        invoker.fns.push(wrappedHook);
      } else {
        // existing plain hook
        invoker = createFnInvoker([oldHook, wrappedHook]);
      }
    }

    invoker.merged = true;
    def[hookKey] = invoker;
  }

  /*  */

  /**
   * 提取 props，得到 res[key] = val
   * 以 props 配置中的属性为 key，父组件中对应的数据为 value
   * 当父组件中数据更新时，触发响应式更新，更新执行 render，生成 VNode，就会有一次走到这里
   * 这样 子组件中响应的数据会被更新
  */
  function extractPropsFromVNodeData (
    // 属性对象
    data,
    // 构造函数
    Ctor,
    // 标签
    tag
  ) {
    // we are only extracting raw values here.
    // validation and default values are handled in the child
    // component itself.
    // 从构造函数拿到 props 配置项
    var propOptions = Ctor.options.props;
    if (isUndef(propOptions)) {
      return
    }
    // 处理 props 配置项
    // res[propKey] = data.xx.key
    var res = {};
    var attrs = data.attrs;
    var props = data.props;
    if (isDef(attrs) || isDef(props)) {
      // 遍历 props 配置项
      for (var key in propOptions) {
        var altKey = hyphenate(key);
        {
          var keyInLowerCase = key.toLowerCase();
          if (
            key !== keyInLowerCase &&
            attrs && hasOwn(attrs, keyInLowerCase)
          ) {
            // props 属性定义的时候 使用小驼峰如:testProp，在使用的时候需要 <div text-prop="xxx"></div>
            tip(
              "Prop \"" + keyInLowerCase + "\" is passed to component " +
              (formatComponentName(tag || Ctor)) + ", but the declared prop name is" +
              " \"" + key + "\". " +
              "Note that HTML attributes are case-insensitive and camelCased " +
              "props need to use their kebab-case equivalents when using in-DOM " +
              "templates. You should probably use \"" + altKey + "\" instead of \"" + key + "\"."
            );
          }
        }
        // 从组件的属性对象上获取组件 props 指定属性的值
        checkProp(res, props, key, altKey, true) ||
        checkProp(res, attrs, key, altKey, false);
      }
    }
    return res
  }

  function checkProp (
    res,
    hash,
    key,
    altKey,
    preserve
  ) {
    if (isDef(hash)) {
      if (hasOwn(hash, key)) {
        res[key] = hash[key];
        if (!preserve) {
          delete hash[key];
        }
        return true
      } else if (hasOwn(hash, altKey)) {
        res[key] = hash[altKey];
        if (!preserve) {
          delete hash[altKey];
        }
        return true
      }
    }
    return false
  }

  /*  */

  // The template compiler attempts to minimize the need for normalization by
  // statically analyzing the template at compile time.
  //
  // For plain HTML markup, normalization can be completely skipped because the
  // generated render function is guaranteed to return Array<VNode>. There are
  // two cases where extra normalization is needed:

  // 1. When the children contains components - because a functional component
  // may return an Array instead of a single root. In this case, just a simple
  // normalization is needed - if any child is an Array, we flatten the whole
  // thing with Array.prototype.concat. It is guaranteed to be only 1-level deep
  // because functional components already normalize their own children.
  function simpleNormalizeChildren (children) {
    for (var i = 0; i < children.length; i++) {
      if (Array.isArray(children[i])) {
        return Array.prototype.concat.apply([], children)
      }
    }
    return children
  }

  // 2. When the children contains constructs that always generated nested Arrays,
  // e.g. <template>, <slot>, v-for, or when the children is provided by user
  // with hand-written render functions / JSX. In such cases a full normalization
  // is needed to cater to all possible types of children values.
  function normalizeChildren (children) {
    return isPrimitive(children)
      ? [createTextVNode(children)]
      : Array.isArray(children)
        ? normalizeArrayChildren(children)
        : undefined
  }

  function isTextNode (node) {
    return isDef(node) && isDef(node.text) && isFalse(node.isComment)
  }

  function normalizeArrayChildren (children, nestedIndex) {
    var res = [];
    var i, c, lastIndex, last;
    for (i = 0; i < children.length; i++) {
      c = children[i];
      if (isUndef(c) || typeof c === 'boolean') { continue }
      lastIndex = res.length - 1;
      last = res[lastIndex];
      //  nested
      if (Array.isArray(c)) {
        if (c.length > 0) {
          c = normalizeArrayChildren(c, ((nestedIndex || '') + "_" + i));
          // merge adjacent text nodes
          if (isTextNode(c[0]) && isTextNode(last)) {
            res[lastIndex] = createTextVNode(last.text + (c[0]).text);
            c.shift();
          }
          res.push.apply(res, c);
        }
      } else if (isPrimitive(c)) {
        if (isTextNode(last)) {
          // merge adjacent text nodes
          // this is necessary for SSR hydration because text nodes are
          // essentially merged when rendered to HTML strings
          res[lastIndex] = createTextVNode(last.text + c);
        } else if (c !== '') {
          // convert primitive to vnode
          res.push(createTextVNode(c));
        }
      } else {
        if (isTextNode(c) && isTextNode(last)) {
          // merge adjacent text nodes
          res[lastIndex] = createTextVNode(last.text + c.text);
        } else {
          // default key for nested array children (likely generated by v-for)
          if (isTrue(children._isVList) &&
            isDef(c.tag) &&
            isUndef(c.key) &&
            isDef(nestedIndex)) {
            c.key = "__vlist" + nestedIndex + "_" + i + "__";
          }
          res.push(c);
        }
      }
    }
    return res
  }

  /*  */

  // 解析组件配置项上的 provide 对象，将其挂载到 vm._provide
  function initProvide (vm) {
    var provide = vm.$options.provide;
    if (provide) {
      vm._provided = typeof provide === 'function'
        ? provide.call(vm)
        : provide;
    }
  }

  /**
   * 
   * 解析 inject 选项  
   * 
   * 1、得到 { key: val } 形式的配置对象
   * 2、对解析结果做响应式处理，代理每个 key 到 vm 实例上
   */
  function initInjections (vm) {
    // 从配置项上解析 inject 选择，最好得到 result[key] = val 的结果
    var result = resolveInject(vm.$options.inject, vm);
    // 对 result 做数据响应式处理
    // 不建议在子组件去更改这些数据，因为一旦祖代组件中 注入的 provide 发生更改，你在组件中做的更改就会被覆盖
    if (result) {
      toggleObserving(false);
      Object.keys(result).forEach(function (key) {
        /* istanbul ignore else */
        {
          defineReactive(vm, key, result[key], function () {
            warn(
              "Avoid mutating an injected value directly since the changes will be " +
              "overwritten whenever the provided component re-renders. " +
              "injection being mutated: \"" + key + "\"",
              vm
            );
          });
        }
      });
      toggleObserving(true);
    }
  }

  function resolveInject (inject, vm) {
    if (inject) {
      // inject is :any because flow is not smart enough to figure out cached
      var result = Object.create(null);
      // inject 配置项的所有的 key
      var keys = hasSymbol
        ? Reflect.ownKeys(inject)
        : Object.keys(inject);

      // 遍历 inject 选项中 key 组成的数组
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        // #6574 in case the inject object is observed...
        // 跳过 __ob__ 对象
        if (key === '__ob__') { continue }
        // 获取 from 属性
        var provideKey = inject[key].from;
        // 遍历所有祖代组件，直到根组件；从祖代组件的配置项中找到 provide 选项，从而找到对应 key 的值
        var source = vm;
        while (source) {
          if (source._provided && hasOwn(source._provided, provideKey)) {
            // result[key] = val
            result[key] = source._provided[provideKey];
            break
          }
          source = source.$parent;
        }
        // 如果都没找到，则采用 inject[key].default，如果没有默认值，则抛出错误
        if (!source) {
          // 设置默认值
          if ('default' in inject[key]) {
            var provideDefault = inject[key].default;
            result[key] = typeof provideDefault === 'function'
              ? provideDefault.call(vm)
              : provideDefault;
          } else {
            warn(("Injection \"" + key + "\" not found"), vm);
          }
        }
      }
      return result
    }
  }

  /*  */



  /**
   * Runtime helper for resolving raw children VNodes into a slot object.
   */
  function resolveSlots (
    children,
    context
  ) {
    if (!children || !children.length) {
      return {}
    }
    var slots = {};
    for (var i = 0, l = children.length; i < l; i++) {
      var child = children[i];
      var data = child.data;
      // remove slot attribute if the node is resolved as a Vue slot node
      if (data && data.attrs && data.attrs.slot) {
        delete data.attrs.slot;
      }
      // named slots should only be respected if the vnode was rendered in the
      // same context.
      if ((child.context === context || child.fnContext === context) &&
        data && data.slot != null
      ) {
        var name = data.slot;
        var slot = (slots[name] || (slots[name] = []));
        if (child.tag === 'template') {
          slot.push.apply(slot, child.children || []);
        } else {
          slot.push(child);
        }
      } else {
        (slots.default || (slots.default = [])).push(child);
      }
    }
    // ignore slots that contains only whitespace
    for (var name$1 in slots) {
      if (slots[name$1].every(isWhitespace)) {
        delete slots[name$1];
      }
    }
    return slots
  }

  function isWhitespace (node) {
    return (node.isComment && !node.asyncFactory) || node.text === ' '
  }

  /*  */

  function isAsyncPlaceholder (node) {
    return node.isComment && node.asyncFactory
  }

  /*  */

  function normalizeScopedSlots (
    slots,
    normalSlots,
    prevSlots
  ) {
    var res;
    var hasNormalSlots = Object.keys(normalSlots).length > 0;
    var isStable = slots ? !!slots.$stable : !hasNormalSlots;
    var key = slots && slots.$key;
    if (!slots) {
      res = {};
    } else if (slots._normalized) {
      // fast path 1: child component re-render only, parent did not change
      return slots._normalized
    } else if (
      isStable &&
      prevSlots &&
      prevSlots !== emptyObject &&
      key === prevSlots.$key &&
      !hasNormalSlots &&
      !prevSlots.$hasNormal
    ) {
      // fast path 2: stable scoped slots w/ no normal slots to proxy,
      // only need to normalize once
      return prevSlots
    } else {
      res = {};
      for (var key$1 in slots) {
        if (slots[key$1] && key$1[0] !== '$') {
          res[key$1] = normalizeScopedSlot(normalSlots, key$1, slots[key$1]);
        }
      }
    }
    // expose normal slots on scopedSlots
    for (var key$2 in normalSlots) {
      if (!(key$2 in res)) {
        res[key$2] = proxyNormalSlot(normalSlots, key$2);
      }
    }
    // avoriaz seems to mock a non-extensible $scopedSlots object
    // and when that is passed down this would cause an error
    if (slots && Object.isExtensible(slots)) {
      (slots)._normalized = res;
    }
    def(res, '$stable', isStable);
    def(res, '$key', key);
    def(res, '$hasNormal', hasNormalSlots);
    return res
  }

  function normalizeScopedSlot(normalSlots, key, fn) {
    var normalized = function () {
      var res = arguments.length ? fn.apply(null, arguments) : fn({});
      res = res && typeof res === 'object' && !Array.isArray(res)
        ? [res] // single vnode
        : normalizeChildren(res);
      var vnode = res && res[0];
      return res && (
        !vnode ||
        (vnode.isComment && !isAsyncPlaceholder(vnode)) // #9658, #10391
      ) ? undefined
        : res
    };
    // this is a slot using the new v-slot syntax without scope. although it is
    // compiled as a scoped slot, render fn users would expect it to be present
    // on this.$slots because the usage is semantically a normal slot.
    if (fn.proxy) {
      Object.defineProperty(normalSlots, key, {
        get: normalized,
        enumerable: true,
        configurable: true
      });
    }
    return normalized
  }

  function proxyNormalSlot(slots, key) {
    return function () { return slots[key]; }
  }

  /*  */

  /**
   * Runtime helper for rendering v-for lists.
   * 负责生成 v-for 指令所在节点的 VNode
   * _l(arr, function(val, key, idx) { return _c(tag, data, children) })
   * v-for 原理：
   *   一个 for 循环，为可迭代对象中的每一个元素执行一次 render 函数，生成一个 VNode，最终将其返回
   */
  function renderList (
    val,
    render
  ) {
    var ret, i, l, keys, key;
    // 数组 或 字符串
    if (Array.isArray(val) || typeof val === 'string') {
      ret = new Array(val.length);
      for (i = 0, l = val.length; i < l; i++) {
        ret[i] = render(val[i], i);
      }
    } else if (typeof val === 'number') {
      // 数值
      ret = new Array(val);
      for (i = 0; i < val; i++) {
        ret[i] = render(i + 1, i);
      }
    } else if (isObject(val)) {
      if (hasSymbol && val[Symbol.iterator]) {
        // 可迭代对象
        ret = [];
        var iterator = val[Symbol.iterator]();
        var result = iterator.next();
        while (!result.done) {
          ret.push(render(result.value, ret.length));
          result = iterator.next();
        }
      } else {
        // 普通对象
        keys = Object.keys(val);
        ret = new Array(keys.length);
        for (i = 0, l = keys.length; i < l; i++) {
          key = keys[i];
          ret[i] = render(val[key], key, i);
        }
      }
    }
    if (!isDef(ret)) {
      ret = [];
    }
    (ret)._isVList = true;
    // 返回 VNode 数组
    return ret
  }

  /*  */

  /**
   * Runtime helper for rendering <slot>
   */
  function renderSlot (
    name,
    fallbackRender,
    props,
    bindObject
  ) {
    var scopedSlotFn = this.$scopedSlots[name];
    var nodes;
    if (scopedSlotFn) {
      // scoped slot
      props = props || {};
      if (bindObject) {
        if ( !isObject(bindObject)) {
          warn('slot v-bind without argument expects an Object', this);
        }
        props = extend(extend({}, bindObject), props);
      }
      nodes =
        scopedSlotFn(props) ||
        (fallbackRender &&
          (Array.isArray(fallbackRender) ? fallbackRender : fallbackRender()));
    } else {
      nodes =
        this.$slots[name] ||
        (fallbackRender &&
          (Array.isArray(fallbackRender) ? fallbackRender : fallbackRender()));
    }

    var target = props && props.slot;
    if (target) {
      return this.$createElement('template', { slot: target }, nodes)
    } else {
      return nodes
    }
  }

  /*  */

  /**
   * Runtime helper for resolving filters
   * 
   * 用于解析过滤器
   * 
   * 第一个参数永远是 表达式的值，或者前一个过滤器处理后的结果
   */
  function resolveFilter (id) {
    return resolveAsset(this.$options, 'filters', id, true) || identity
  }

  /*  */

  function isKeyNotMatch (expect, actual) {
    if (Array.isArray(expect)) {
      return expect.indexOf(actual) === -1
    } else {
      return expect !== actual
    }
  }

  /**
   * Runtime helper for checking keyCodes from config.
   * exposed as Vue.prototype._k
   * passing in eventKeyName as last argument separately for backwards compat
   */
  function checkKeyCodes (
    eventKeyCode,
    key,
    builtInKeyCode,
    eventKeyName,
    builtInKeyName
  ) {
    var mappedKeyCode = config.keyCodes[key] || builtInKeyCode;
    if (builtInKeyName && eventKeyName && !config.keyCodes[key]) {
      return isKeyNotMatch(builtInKeyName, eventKeyName)
    } else if (mappedKeyCode) {
      return isKeyNotMatch(mappedKeyCode, eventKeyCode)
    } else if (eventKeyName) {
      return hyphenate(eventKeyName) !== key
    }
    return eventKeyCode === undefined
  }

  /*  */

  /**
   * Runtime helper for merging v-bind="object" into a VNode's data.
   */
  function bindObjectProps (
    data,
    tag,
    value,
    asProp,
    isSync
  ) {
    if (value) {
      if (!isObject(value)) {
         warn(
          'v-bind without argument expects an Object or Array value',
          this
        );
      } else {
        if (Array.isArray(value)) {
          value = toObject(value);
        }
        var hash;
        var loop = function ( key ) {
          if (
            key === 'class' ||
            key === 'style' ||
            isReservedAttribute(key)
          ) {
            hash = data;
          } else {
            var type = data.attrs && data.attrs.type;
            hash = asProp || config.mustUseProp(tag, type, key)
              ? data.domProps || (data.domProps = {})
              : data.attrs || (data.attrs = {});
          }
          var camelizedKey = camelize(key);
          var hyphenatedKey = hyphenate(key);
          if (!(camelizedKey in hash) && !(hyphenatedKey in hash)) {
            hash[key] = value[key];

            if (isSync) {
              var on = data.on || (data.on = {});
              on[("update:" + key)] = function ($event) {
                value[key] = $event;
              };
            }
          }
        };

        for (var key in value) loop( key );
      }
    }
    return data
  }

  /*  */

  /**
   * Runtime helper for rendering static trees.
   * 运行时负责生成静态树的 VNode 的帮助程序
   * _m(idx, true or '')
   * 1：执行 staticRenderFns 数组中指定下标的渲染函数，生成 VNode 并缓存
   * 2：为静态树的 VNode 打静态标记
   */
  function renderStatic (
    index,
    isInFor
  ) {
    // 缓存
    var cached = this._staticTrees || (this._staticTrees = []);
    var tree = cached[index];
    // if has already-rendered static tree and not inside v-for,
    // we can reuse the same tree.
    // 当前静态树已被渲染且没有包裹在 v-for 指令，则直接返回 缓存的 VNode
    if (tree && !isInFor) {
      return tree
    }
    // otherwise, render a fresh tree.
    tree = cached[index] = this.$options.staticRenderFns[index].call(
      this._renderProxy,
      null,
      this // for render fns generated for functional component templates
    );
    // 对 VNode 做静态标记
    markStatic(tree, ("__static__" + index), false);
    return tree
  }

  /**
   * Runtime helper for v-once.
   * Effectively it means marking the node as static with a unique key.
   */
  function markOnce (
    tree,
    index,
    key
  ) {
    markStatic(tree, ("__once__" + index + (key ? ("_" + key) : "")), true);
    return tree
  }

  function markStatic (
    tree,
    key,
    isOnce
  ) {
    if (Array.isArray(tree)) {
      // tree 为 VNode 数组，循环遍历其中的每个 VNode，为其做静态标记
      for (var i = 0; i < tree.length; i++) {
        if (tree[i] && typeof tree[i] !== 'string') {
          markStaticNode(tree[i], (key + "_" + i), isOnce);
        }
      }
    } else {
      markStaticNode(tree, key, isOnce);
    }
  }

  // 标记静态 VNode
  function markStaticNode (node, key, isOnce) {
    node.isStatic = true;
    node.key = key;
    node.isOnce = isOnce;
  }

  /*  */

  function bindObjectListeners (data, value) {
    if (value) {
      if (!isPlainObject(value)) {
         warn(
          'v-on without argument expects an Object value',
          this
        );
      } else {
        var on = data.on = data.on ? extend({}, data.on) : {};
        for (var key in value) {
          var existing = on[key];
          var ours = value[key];
          on[key] = existing ? [].concat(existing, ours) : ours;
        }
      }
    }
    return data
  }

  /*  */

  function resolveScopedSlots (
    fns, // see flow/vnode
    res,
    // the following are added in 2.6
    hasDynamicKeys,
    contentHashKey
  ) {
    res = res || { $stable: !hasDynamicKeys };
    for (var i = 0; i < fns.length; i++) {
      var slot = fns[i];
      if (Array.isArray(slot)) {
        resolveScopedSlots(slot, res, hasDynamicKeys);
      } else if (slot) {
        // marker for reverse proxying v-slot without scope on this.$slots
        if (slot.proxy) {
          slot.fn.proxy = true;
        }
        res[slot.key] = slot.fn;
      }
    }
    if (contentHashKey) {
      (res).$key = contentHashKey;
    }
    return res
  }

  /*  */

  function bindDynamicKeys (baseObj, values) {
    for (var i = 0; i < values.length; i += 2) {
      var key = values[i];
      if (typeof key === 'string' && key) {
        baseObj[values[i]] = values[i + 1];
      } else if ( key !== '' && key !== null) {
        // null is a special value for explicitly removing a binding
        warn(
          ("Invalid value for dynamic directive argument (expected string or null): " + key),
          this
        );
      }
    }
    return baseObj
  }

  // helper to dynamically append modifier runtime markers to event names.
  // ensure only append when value is already string, otherwise it will be cast
  // to string and cause the type check to miss.
  function prependModifier (value, symbol) {
    return typeof value === 'string' ? symbol + value : value
  }

  /*  */

  function installRenderHelpers (target) {
    // _c = $createElement
    // _c(tag, data, children)
    // 处理 v-once 指令
    target._o = markOnce;
    // 将值转换为数值，parseFloat 方法实现
    target._n = toNumber;
    // 将值转换为字符串，对象 JSON.stringify，原始值： String
    target._s = toString;
    // v-for
    target._l = renderList;
    // 插槽 slot
    target._t = renderSlot;
    // 判断两个值是否相等，类似 ==
    target._q = looseEqual;
    // 类似 indexOf
    target._i = looseIndexOf;
    // 负责生成静态树 VNode
    target._m = renderStatic;
    // 解析过滤器 filter
    target._f = resolveFilter;
    target._k = checkKeyCodes;
    target._b = bindObjectProps;
    // 为文本节点生成 VNode
    target._v = createTextVNode;
    // 为空节点生成 VNode
    target._e = createEmptyVNode;
    // 作用域插槽
    target._u = resolveScopedSlots;
    target._g = bindObjectListeners;
    target._d = bindDynamicKeys;
    target._p = prependModifier;
  }

  /*  */

  function FunctionalRenderContext (
    data,
    props,
    children,
    parent,
    Ctor
  ) {
    var this$1 = this;

    var options = Ctor.options;
    // ensure the createElement function in functional components
    // gets a unique context - this is necessary for correct named slot check
    var contextVm;
    if (hasOwn(parent, '_uid')) {
      contextVm = Object.create(parent);
      // $flow-disable-line
      contextVm._original = parent;
    } else {
      // the context vm passed in is a functional context as well.
      // in this case we want to make sure we are able to get a hold to the
      // real context instance.
      contextVm = parent;
      // $flow-disable-line
      parent = parent._original;
    }
    var isCompiled = isTrue(options._compiled);
    var needNormalization = !isCompiled;

    this.data = data;
    this.props = props;
    this.children = children;
    this.parent = parent;
    this.listeners = data.on || emptyObject;
    this.injections = resolveInject(options.inject, parent);
    this.slots = function () {
      if (!this$1.$slots) {
        normalizeScopedSlots(
          data.scopedSlots,
          this$1.$slots = resolveSlots(children, parent)
        );
      }
      return this$1.$slots
    };

    Object.defineProperty(this, 'scopedSlots', ({
      enumerable: true,
      get: function get () {
        return normalizeScopedSlots(data.scopedSlots, this.slots())
      }
    }));

    // support for compiled functional template
    if (isCompiled) {
      // exposing $options for renderStatic()
      this.$options = options;
      // pre-resolve slots for renderSlot()
      this.$slots = this.slots();
      this.$scopedSlots = normalizeScopedSlots(data.scopedSlots, this.$slots);
    }

    if (options._scopeId) {
      this._c = function (a, b, c, d) {
        var vnode = createElement(contextVm, a, b, c, d, needNormalization);
        if (vnode && !Array.isArray(vnode)) {
          vnode.fnScopeId = options._scopeId;
          vnode.fnContext = parent;
        }
        return vnode
      };
    } else {
      this._c = function (a, b, c, d) { return createElement(contextVm, a, b, c, d, needNormalization); };
    }
  }

  installRenderHelpers(FunctionalRenderContext.prototype);

  /**
   * 解析 props 配置对象
   * 生成函数式组件的渲染上下文
   * 执行组件的 render 函数生成 VNode，然后返回
  */
  function createFunctionalComponent (
    Ctor,
    propsData,
    data,
    contextVm,
    children
  ) {
    // 组件配置项
    var options = Ctor.options;
    // props 对象
    var props = {};
    // 从组件配置项上获取 props 配置
    var propOptions = options.props;
    if (isDef(propOptions)) {
      // 说明函数式组件提供了 props 配置
      for (var key in propOptions) {
        props[key] = validateProp(key, propOptions, propsData || emptyObject);
      }
    } else {
      // 没有提供 props 配置
      if (isDef(data.attrs)) { mergeProps(props, data.attrs); }
      if (isDef(data.props)) { mergeProps(props, data.props); }
    }

    var renderContext = new FunctionalRenderContext(
      data,
      props,
      children,
      contextVm,
      Ctor
    );

    // 执行函数式组件的 render 函数,生成组件的 VNode
    var vnode = options.render.call(null, renderContext._c, renderContext);

    // 返回生成的 VNode
    if (vnode instanceof VNode) {
      return cloneAndMarkFunctionalResult(vnode, data, renderContext.parent, options, renderContext)
    } else if (Array.isArray(vnode)) {
      var vnodes = normalizeChildren(vnode) || [];
      var res = new Array(vnodes.length);
      for (var i = 0; i < vnodes.length; i++) {
        res[i] = cloneAndMarkFunctionalResult(vnodes[i], data, renderContext.parent, options, renderContext);
      }
      return res
    }
  }

  function cloneAndMarkFunctionalResult (vnode, data, contextVm, options, renderContext) {
    // #7817 clone node before setting fnContext, otherwise if the node is reused
    // (e.g. it was from a cached normal slot) the fnContext causes named slots
    // that should not be matched to match.
    var clone = cloneVNode(vnode);
    clone.fnContext = contextVm;
    clone.fnOptions = options;
    {
      (clone.devtoolsMeta = clone.devtoolsMeta || {}).renderContext = renderContext;
    }
    if (data.slot) {
      (clone.data || (clone.data = {})).slot = data.slot;
    }
    return clone
  }

  function mergeProps (to, from) {
    for (var key in from) {
      to[camelize(key)] = from[key];
    }
  }

  /*  */

  // inline hooks to be invoked on component VNodes during patch
  // patch 期间，在组件 VNode 上调用内联钩子
  var componentVNodeHooks = {
    init: function init (vnode, hydrating) {
      if (
        vnode.componentInstance &&
        !vnode.componentInstance._isDestroyed &&
        vnode.data.keepAlive
      ) {
        // kept-alive components, treat as a patch
        // 当组件被 keep-alive 包裹时
        var mountedNode = vnode; // work around flow
        componentVNodeHooks.prepatch(mountedNode, mountedNode);
      } else {
        // 非 keep-alive 或组件初始化
        // 实例化子组件
        var child = vnode.componentInstance = createComponentInstanceForVnode(
          vnode,
          activeInstance
        );
        // 执行子组件 $mount，进入挂载阶段，接下来通过编译得到 render 函数，接着走 挂载、patch，直到渲染到页面
        child.$mount(hydrating ? vnode.elm : undefined, hydrating);
      }
    },

    prepatch: function prepatch (oldVnode, vnode) {
      // 用新的 VNode 更新老的 VNode 上的属性
      var options = vnode.componentOptions;
      var child = vnode.componentInstance = oldVnode.componentInstance;
      updateChildComponent(
        child,
        options.propsData, // updated props
        options.listeners, // updated listeners
        vnode, // new parent vnode
        options.children // new children
      );
    },

    insert: function insert (vnode) {
      var context = vnode.context;
      var componentInstance = vnode.componentInstance;
      if (!componentInstance._isMounted) {
        componentInstance._isMounted = true;
        callHook(componentInstance, 'mounted');
      }
      if (vnode.data.keepAlive) {
        if (context._isMounted) {
          // vue-router#1212
          // During updates, a kept-alive component's child components may
          // change, so directly walking the tree here may call activated hooks
          // on incorrect children. Instead we push them into a queue which will
          // be processed after the whole patch process ended.
          queueActivatedComponent(componentInstance);
        } else {
          activateChildComponent(componentInstance, true /* direct */);
        }
      }
    },

    destroy: function destroy (vnode) {
      var componentInstance = vnode.componentInstance;
      if (!componentInstance._isDestroyed) {
        if (!vnode.data.keepAlive) {
          componentInstance.$destroy();
        } else {
          deactivateChildComponent(componentInstance, true /* direct */);
        }
      }
    }
  };

  var hooksToMerge = Object.keys(componentVNodeHooks);

  function createComponent (
    // 组件的构造函数
    Ctor,
    // 属性对象
    data,
    // 上下文
    context,
    // 子节点数据
    children,
    // 标签名
    tag
  ) {
    if (isUndef(Ctor)) {
      // 构造函数不存在
      return
    }

    // Vue.extend 方法
    var baseCtor = context.$options._base;

    // plain options object: turn it into a constructor
    // 如果 Ctor 是组件的配置项，则通过 Vue.extend(options) 将其转换为组件的构造函数
    if (isObject(Ctor)) {
      Ctor = baseCtor.extend(Ctor);
    }

    // if at this stage it's not a constructor or an async component factory,
    // reject.
    // 如果 Ctor 还不是一个函数，抛出错误，表明当前组件定义有问题
    if (typeof Ctor !== 'function') {
      {
        warn(("Invalid Component definition: " + (String(Ctor))), context);
      }
      return
    }

    // async component
    // 异步组件
    var asyncFactory;
    if (isUndef(Ctor.cid)) {
      asyncFactory = Ctor;
      Ctor = resolveAsyncComponent(asyncFactory, baseCtor);
      if (Ctor === undefined) {
        // return a placeholder node for async component, which is rendered
        // as a comment node but preserves all the raw information for the node.
        // the information will be used for async server-rendering and hydration.
        return createAsyncPlaceholder(
          asyncFactory,
          data,
          context,
          children,
          tag
        )
      }
    }

    data = data || {};

    // resolve constructor options in case global mixins are applied after
    // component constructor creation
    // 子组件选项合并，编译器将组件编译为渲染函数，渲染函数执行 render 函数，然后执行其中的 _c，做选项合并
    resolveConstructorOptions(Ctor);

    // transform component v-model data into props & events
    // 将组件的 v-model 的信息（值和回调函数）转换为 data、attrs 对象上的属性、值和 data.on 对象上的事件名和回调
    if (isDef(data.model)) {
      transformModel(Ctor.options, data);
    }

    // extract props
    // 提取 props 配置
    var propsData = extractPropsFromVNodeData(data, Ctor, tag);

    // functional component
    // 处理函数式组件，执行 render 函数生成 VNode
    if (isTrue(Ctor.options.functional)) {
      return createFunctionalComponent(Ctor, propsData, data, context, children)
    }

    // extract listeners, since these needs to be treated as
    // child component listeners instead of DOM listeners
    // 获取事件监听器对象
    var listeners = data.on;
    // replace with listeners with .native modifier
    // so it gets processed during parent component patch.
    // 将 .native 修饰符的事件对象赋值到 data.on
    data.on = data.nativeOn;

    if (isTrue(Ctor.options.abstract)) {
      // abstract components do not keep anything
      // other than props & listeners & slot

      // work around flow
      var slot = data.slot;
      data = {};
      if (slot) {
        data.slot = slot;
      }
    }

    // install component management hooks onto the placeholder node
    // 当前组件是一个普通的自定义组件（不是函数式组件），在 data.hook 上安装一些内置钩子
    // init、prepatch、insert、destroy 在 patch 节点被调用
    installComponentHooks(data);

    // return a placeholder vnode
    var name = Ctor.options.name || tag;
    // 实例化 VNode
    var vnode = new VNode(
      ("vue-component-" + (Ctor.cid) + (name ? ("-" + name) : '')),
      data, undefined, undefined, undefined, context,
      { Ctor: Ctor, propsData: propsData, listeners: listeners, tag: tag, children: children },
      asyncFactory
    );

    return vnode
  }

  function createComponentInstanceForVnode (
    // we know it's MountedComponentVNode but flow doesn't
    vnode,
    // activeInstance in lifecycle state
    parent
  ) {
    var options = {
      _isComponent: true,
      _parentVnode: vnode,
      parent: parent
    };
    // check inline-template render functions
    var inlineTemplate = vnode.data.inlineTemplate;
    if (isDef(inlineTemplate)) {
      options.render = inlineTemplate.render;
      options.staticRenderFns = inlineTemplate.staticRenderFns;
    }
    // new 组件构造函数，得到组件实例
    return new vnode.componentOptions.Ctor(options)
  }

  function installComponentHooks (data) {
    // 定义 data.hook 对象
    var hooks = data.hook || (data.hook = {});
    // hooksToMerge = ['init', 'prepatch', 'insert', 'destroy']
    for (var i = 0; i < hooksToMerge.length; i++) {
      // 获取 key,如 init
      var key = hooksToMerge[i];
      // 获取用户传递的 init 方法
      var existing = hooks[key];
      // 内置的 init 方法
      var toMerge = componentVNodeHooks[key];
      if (existing !== toMerge && !(existing && existing._merged)) {
        // 合并用户传递和内置的方法
        hooks[key] = existing ? mergeHook$1(toMerge, existing) : toMerge;
      }
    }
  }

  function mergeHook$1 (f1, f2) {
    var merged = function (a, b) {
      // flow complains about extra args which is why we use any
      f1(a, b);
      f2(a, b);
    };
    merged._merged = true;
    return merged
  }

  // transform component v-model info (value and callback) into
  // prop and event handler respectively.
  function transformModel (options, data) {
    var prop = (options.model && options.model.prop) || 'value';
    var event = (options.model && options.model.event) || 'input'
    // 处理属性值，在 data.attrs[props] = data.model.val
    ;(data.attrs || (data.attrs = {}))[prop] = data.model.value;
    // 处理事件  data.on = { eventName: [cn1, cb2, ...] }
    var on = data.on || (data.on = {});
    var existing = on[event];
    var callback = data.model.callback;
    if (isDef(existing)) {
      if (
        Array.isArray(existing)
          ? existing.indexOf(callback) === -1
          : existing !== callback
      ) {
        on[event] = [callback].concat(existing);
      }
    } else {
      on[event] = callback;
    }
  }

  /*  */

  var SIMPLE_NORMALIZE = 1;
  var ALWAYS_NORMALIZE = 2;

  // wrapper function for providing a more flexible interface
  // without getting yelled at by flow
  function createElement (
    context,
    tag,
    data,
    children,
    normalizationType,
    alwaysNormalize
  ) {
    if (Array.isArray(data) || isPrimitive(data)) {
      normalizationType = children;
      children = data;
      data = undefined;
    }
    if (isTrue(alwaysNormalize)) {
      normalizationType = ALWAYS_NORMALIZE;
    }
    return _createElement(context, tag, data, children, normalizationType)
  }

  function _createElement (
    // 上下文
    context,
    // 标签
    tag,
    // 属性的 JSON 字符串
    data,
    // 子节点数据
    children,
    // 规范化类型
    normalizationType
  ) {
    if (isDef(data) && isDef((data).__ob__)) {
      // 属性不能是 响应式对象
       warn(
        "Avoid using observed data object as vnode data: " + (JSON.stringify(data)) + "\n" +
        'Always create fresh vnode data objects in each render!',
        context
      );
      // 返回空节点的 VNode
      return createEmptyVNode()
    }
    // object syntax in v-bind
    if (isDef(data) && isDef(data.is)) {
      tag = data.is;
    }
    // 标签名不存在“ 动态组件
    if (!tag) {
      // in case of component :is set to falsy value
      return createEmptyVNode()
    }
    // warn against non-primitive key
    // 唯一键 key 必须是一个原始值
    if (
      isDef(data) && isDef(data.key) && !isPrimitive(data.key)
    ) {
      {
        warn(
          'Avoid using non-primitive value as key, ' +
          'use string/number value instead.',
          context
        );
      }
    }
    // support single function children as default scoped slot
    // 子节点只有一个 && 子节点是函数  则当做默认插槽处理
    if (Array.isArray(children) &&
      typeof children[0] === 'function'
    ) {
      data = data || {};
      data.scopedSlots = { default: children[0] };
      children.length = 0;
    }
    // 标准化处理
    if (normalizationType === ALWAYS_NORMALIZE) {
      children = normalizeChildren(children);
    } else if (normalizationType === SIMPLE_NORMALIZE) {
      children = simpleNormalizeChildren(children);
    }

    // 重点
    var vnode, ns;
    if (typeof tag === 'string') {
      // 标签时字符串
      var Ctor;
      // 命名空间
      ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag);
      if (config.isReservedTag(tag)) {
        // platform built-in elements
        // 平台保留标签（原生标签）
        if ( isDef(data) && isDef(data.nativeOn) && data.tag !== 'component') {
          warn(
            ("The .native modifier for v-on is only valid on components but it was used on <" + tag + ">."),
            context
          );
        }
        // 直接实例化 VNode
        vnode = new VNode(
          config.parsePlatformTagName(tag), data, children,
          undefined, undefined, context
        );
      } else if ((!data || !data.pre) && isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
        // component
        // 处理组件，在 this.$options.components 对象中获取指定组件的构造函数
        vnode = createComponent(Ctor, data, context, children, tag);
      } else {
        // 不认识此标签，也生成 VNode，在运行时做检查
        // unknown or unlisted namespaced elements
        // check at runtime because it may get assigned a namespace when its
        // parent normalizes children
        vnode = new VNode(
          tag, data, children,
          undefined, undefined, context
        );
      }
    } else {
      // direct component options / constructor
      // 标签不是字符串，是组件配置对象或组件构造函数
      vnode = createComponent(tag, data, context, children);
    }
    if (Array.isArray(vnode)) {
      return vnode
    } else if (isDef(vnode)) {
      if (isDef(ns)) { applyNS(vnode, ns); }
      if (isDef(data)) { registerDeepBindings(data); }
      return vnode
    } else {
      return createEmptyVNode()
    }
  }

  function applyNS (vnode, ns, force) {
    vnode.ns = ns;
    if (vnode.tag === 'foreignObject') {
      // use default namespace inside foreignObject
      ns = undefined;
      force = true;
    }
    if (isDef(vnode.children)) {
      for (var i = 0, l = vnode.children.length; i < l; i++) {
        var child = vnode.children[i];
        if (isDef(child.tag) && (
          isUndef(child.ns) || (isTrue(force) && child.tag !== 'svg'))) {
          applyNS(child, ns, force);
        }
      }
    }
  }

  // ref #5318
  // necessary to ensure parent re-render when deep bindings like :style and
  // :class are used on slot nodes
  function registerDeepBindings (data) {
    if (isObject(data.style)) {
      traverse(data.style);
    }
    if (isObject(data.class)) {
      traverse(data.class);
    }
  }

  /*  */

  function initRender (vm) {
    vm._vnode = null; // the root of the child tree
    vm._staticTrees = null; // v-once cached trees
    var options = vm.$options;
    var parentVnode = vm.$vnode = options._parentVnode; // the placeholder node in parent tree
    var renderContext = parentVnode && parentVnode.context;
    vm.$slots = resolveSlots(options._renderChildren, renderContext);
    vm.$scopedSlots = emptyObject;
    // bind the createElement fn to this instance
    // so that we get proper render context inside it.
    // args order: tag, data, children, normalizationType, alwaysNormalize
    // internal version is used by render functions compiled from templates
    // 标签、属性的 JSON 字符串、child 子节点、是否是标准属性
    // 返回 VNode 或 VNodeArray
    vm._c = function (a, b, c, d) { return createElement(vm, a, b, c, d, false); };
    // normalization is always applied for the public version, used in
    // user-written render functions.
    vm.$createElement = function (a, b, c, d) { return createElement(vm, a, b, c, d, true); };

    // $attrs & $listeners are exposed for easier HOC creation.
    // they need to be reactive so that HOCs using them are always updated
    var parentData = parentVnode && parentVnode.data;

    /* istanbul ignore else */
    {
      defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, function () {
        !isUpdatingChildComponent && warn("$attrs is readonly.", vm);
      }, true);
      defineReactive(vm, '$listeners', options._parentListeners || emptyObject, function () {
        !isUpdatingChildComponent && warn("$listeners is readonly.", vm);
      }, true);
    }
  }

  var currentRenderingInstance = null;

  function renderMixin (Vue) {
    // install runtime convenience helpers
    // 在组件实例上挂载一些运行时需要用到的工具方法
    installRenderHelpers(Vue.prototype);

    // Vue.$nextTick
    Vue.prototype.$nextTick = function (fn) {
      return nextTick(fn, this)
    };

    /**
     * 执行组件的 render 函数，得到组件的 vnode
     * 加了大量的 异常代码处理
     * 
    */
    Vue.prototype._render = function () {
      var vm = this;
      // 获取 render 函数
      // 用户实例化 vue 时提供了 render 配置项
      // 编译器编译模板生成的 render 
      var ref = vm.$options;
      var render = ref.render;
      var _parentVnode = ref._parentVnode;

      if (_parentVnode) {
        // 标准化作用域插槽
        vm.$scopedSlots = normalizeScopedSlots(
          _parentVnode.data.scopedSlots,
          vm.$slots,
          vm.$scopedSlots
        );
      }

      // set parent vnode. this allows render functions to have access
      // to the data on the placeholder node.
      // 设置父 vnode，使得渲染函数可以访问占位符节点上的数据
      vm.$vnode = _parentVnode;
      // render self
      var vnode;
      try {
        // There's no need to maintain a stack because all render fns are called
        // separately from one another. Nested component's render fns are called
        // when parent component is patched.
        currentRenderingInstance = vm;
        // 执行 render 函数，得到组件的 vnode
        vnode = render.call(vm._renderProxy, vm.$createElement);
      } catch (e) {
        handleError(e, vm, "render");
        // return error render result,
        // or previous vnode to prevent render error causing blank component
        /* istanbul ignore else */
        // 执行 render 函数时出错
        if ( vm.$options.renderError) {
          try {
            vnode = vm.$options.renderError.call(vm._renderProxy, vm.$createElement, e);
          } catch (e) {
            handleError(e, vm, "renderError");
            vnode = vm._vnode;
          }
        } else {
          vnode = vm._vnode;
        }
      } finally {
        currentRenderingInstance = null;
      }
      // if the returned array contains only a single node, allow it
      // 返回的 vnode 是数组，并只包含一个元素，直接将其打平
      if (Array.isArray(vnode) && vnode.length === 1) {
        vnode = vnode[0];
      }
      // return empty vnode in case the render function errored out
      // render 函数出错，返回一个空的 vnode
      if (!(vnode instanceof VNode)) {
        if ( Array.isArray(vnode)) {
          warn(
            'Multiple root nodes returned from render function. Render function ' +
            'should return a single root node.',
            vm
          );
        }
        vnode = createEmptyVNode();
      }
      // set parent
      vnode.parent = _parentVnode;
      return vnode
    };
  }

  /*  */

  function ensureCtor (comp, base) {
    if (
      comp.__esModule ||
      (hasSymbol && comp[Symbol.toStringTag] === 'Module')
    ) {
      comp = comp.default;
    }
    return isObject(comp)
      ? base.extend(comp)
      : comp
  }

  function createAsyncPlaceholder (
    factory,
    data,
    context,
    children,
    tag
  ) {
    var node = createEmptyVNode();
    node.asyncFactory = factory;
    node.asyncMeta = { data: data, context: context, children: children, tag: tag };
    return node
  }

  function resolveAsyncComponent (
    factory,
    baseCtor
  ) {
    if (isTrue(factory.error) && isDef(factory.errorComp)) {
      return factory.errorComp
    }

    if (isDef(factory.resolved)) {
      return factory.resolved
    }

    var owner = currentRenderingInstance;
    if (owner && isDef(factory.owners) && factory.owners.indexOf(owner) === -1) {
      // already pending
      factory.owners.push(owner);
    }

    if (isTrue(factory.loading) && isDef(factory.loadingComp)) {
      return factory.loadingComp
    }

    if (owner && !isDef(factory.owners)) {
      var owners = factory.owners = [owner];
      var sync = true;
      var timerLoading = null;
      var timerTimeout = null

      ;(owner).$on('hook:destroyed', function () { return remove(owners, owner); });

      var forceRender = function (renderCompleted) {
        for (var i = 0, l = owners.length; i < l; i++) {
          (owners[i]).$forceUpdate();
        }

        if (renderCompleted) {
          owners.length = 0;
          if (timerLoading !== null) {
            clearTimeout(timerLoading);
            timerLoading = null;
          }
          if (timerTimeout !== null) {
            clearTimeout(timerTimeout);
            timerTimeout = null;
          }
        }
      };

      var resolve = once(function (res) {
        // cache resolved
        factory.resolved = ensureCtor(res, baseCtor);
        // invoke callbacks only if this is not a synchronous resolve
        // (async resolves are shimmed as synchronous during SSR)
        if (!sync) {
          forceRender(true);
        } else {
          owners.length = 0;
        }
      });

      var reject = once(function (reason) {
         warn(
          "Failed to resolve async component: " + (String(factory)) +
          (reason ? ("\nReason: " + reason) : '')
        );
        if (isDef(factory.errorComp)) {
          factory.error = true;
          forceRender(true);
        }
      });

      var res = factory(resolve, reject);

      if (isObject(res)) {
        if (isPromise(res)) {
          // () => Promise
          if (isUndef(factory.resolved)) {
            res.then(resolve, reject);
          }
        } else if (isPromise(res.component)) {
          res.component.then(resolve, reject);

          if (isDef(res.error)) {
            factory.errorComp = ensureCtor(res.error, baseCtor);
          }

          if (isDef(res.loading)) {
            factory.loadingComp = ensureCtor(res.loading, baseCtor);
            if (res.delay === 0) {
              factory.loading = true;
            } else {
              timerLoading = setTimeout(function () {
                timerLoading = null;
                if (isUndef(factory.resolved) && isUndef(factory.error)) {
                  factory.loading = true;
                  forceRender(false);
                }
              }, res.delay || 200);
            }
          }

          if (isDef(res.timeout)) {
            timerTimeout = setTimeout(function () {
              timerTimeout = null;
              if (isUndef(factory.resolved)) {
                reject(
                   ("timeout (" + (res.timeout) + "ms)")
                    
                );
              }
            }, res.timeout);
          }
        }
      }

      sync = false;
      // return in case resolved synchronously
      return factory.loading
        ? factory.loadingComp
        : factory.resolved
    }
  }

  /*  */

  function getFirstComponentChild (children) {
    if (Array.isArray(children)) {
      for (var i = 0; i < children.length; i++) {
        var c = children[i];
        if (isDef(c) && (isDef(c.componentOptions) || isAsyncPlaceholder(c))) {
          return c
        }
      }
    }
  }

  /*  */

  function initEvents (vm) {
    //  用来存储事件对象
    vm._events = Object.create(null);
    vm._hasHookEvent = false;
    // init parent attached events
    // 父组件 事件监听器
    var listeners = vm.$options._parentListeners;
    if (listeners) {
      // 存在事件监听器 将父组件向子组件注册的事件注册到子组件的实例中
      updateComponentListeners(vm, listeners);
    }
  }

  var target;

  function add (event, fn) {
    // this.$on
    target.$on(event, fn);
  }

  function remove$1 (event, fn) {
    target.$off(event, fn);
  }

  function createOnceHandler (event, fn) {
    var _target = target;
    return function onceHandler () {
      var res = fn.apply(null, arguments);
      if (res !== null) {
        _target.$off(event, onceHandler);
      }
    }
  }

  function updateComponentListeners (
    vm,
    listeners,
    oldListeners
  ) {
    target = vm;
    // 如果 listeners 对象中存在某个 key（即事件名）而 oldListeners 中不存在，则需要新增事件
    // 反之：则需要从事件系统中卸载
    updateListeners(listeners, oldListeners || {}, add, remove$1, createOnceHandler, vm);
    target = undefined;
  }

  /**
   * methods: {
      isClick () {
        this.$emit('isLeft', '点击事件！')
      },
      isClickOther () {
        this.$emit('isRight', ['点击1', '点击2'])
      }
    },
    mounted () {
      this.$on('isLeft', val => {
        console.log(val)
      })
      this.$on('isLeft', val => {
        console.log('=====')
      })
      this.$on('isRight', (...val) => {
        console.log(val)
      })
      this.$on(['isLeft', 'isRight'], () => {
        console.log(666)
      })
    }
  */
  function eventsMixin (Vue) {
    var hookRE = /^hook:/;
    /**
     * 监听实例上的自定义事件
     * 将所有事件和对应的回调放到 vm._event 对象上
     * vm._event = { eventName: [fn1,fn2,...],... }
    */
    Vue.prototype.$on = function (event, fn) {
      var vm = this;
      // 事件为数组的情况
      // this.$on([event1,event2,...], () => { xxx })
      if (Array.isArray(event)) {
        for (var i = 0, l = event.length; i < l; i++) {
          // 调用 $on
          vm.$on(event[i], fn);
        }
      } else {
        // 一个事件可以设置多个响应函数
        // this.$on('custom-click', cb1)
        // this.$on('custom-click', cb2)
        (vm._events[event] || (vm._events[event] = [])).push(fn);
        // optimize hook:event cost by using a boolean flag marked at registration
        // instead of a hash lookup
        // <comp @hook:mounted="handleHookMounted"
        // hookEvent 提供从外部为组件实例注入声明周期方法的机会
        // 比如 从组件外部为组件的 mounted 方法注入额外的逻辑
        // 结合 callhook 方法实现
        if (hookRE.test(event)) {
          // 置为 true，标记当前组件实例存在 hook event
          vm._hasHookEvent = true;
        }
      }
      return vm
    };

    /**
     * 监听一个自定义事件，但值触发一次。一旦触发，监听器就会被移除
    */
    Vue.prototype.$once = function (event, fn) {
      var vm = this;
      // 包装函数  调用 $on，只是 $on 的回调函数被特殊处理，触发时，执行回调函数，先移除事件监听，然后执行你设置的回调函数
      function on () {
        vm.$off(event, on);
        fn.apply(vm, arguments);
      }
      // 赋值 fn 用于移除时 对比 删除
      on.fn = fn;
      // 将包装函数作为事件的回调函数
      vm.$on(event, on);
      return vm
    };

    /**
     * 移除事件监听器，即从 vm._events 对象中找到对应的事件，移除所有事件 或者 移除指定事件的回调函数
     *   1：如果没有参数，则移除所有的事件监听器; vm._events = {}
     *   2：只提供了一个参数，则移除该事件所有的监听器; vm._events[event] = null
     *   3：提供了两个参数，则移除指定事件的指定回调函数
     * 
     * 通过 $on 设置的 vm._events 对象
    */
    Vue.prototype.$off = function (event, fn) {
      var vm = this;
      // all
      // 没有参数，移除所有事件监听器 => vm._events = {}
      if (!arguments.length) {
        vm._events = Object.create(null);
        return vm
      }
      // array of events
      if (Array.isArray(event)) {
        for (var i$1 = 0, l = event.length; i$1 < l; i$1++) {
          vm.$off(event[i$1], fn);
        }
        return vm
      }
      // specific event
      // 获取指定事件的回调函数
      var cbs = vm._events[event];
      if (!cbs) {
        // 表示没有注册事件
        return vm
      }
      if (!fn) {
        // 没有 fn 回调函数,则移除改事件的所有回调函数
        vm._events[event] = null;
        return vm
      }
      // specific handler
      // 移除指定事件的指定回调函数,从数组的回调函数中找到改回调函数,然后删除
      var cb;
      var i = cbs.length;
      while (i--) {
        cb = cbs[i];
        // cb.fn === fn  $once 移除时
        if (cb === fn || cb.fn === fn) {
          cbs.splice(i, 1);
          break
        }
      }
      return vm
    };

    /**
     * 触发实例上的指定事件 vm._events[event] => cbs => loop cbs => cb(args)
    */
    Vue.prototype.$emit = function (event) {
      var vm = this;
      {
        // 事件名转换为小写
        var lowerCaseEvent = event.toLowerCase();
        // HTML 属性不区分大小写， 不能 v-on 监听小驼峰形式的事件，使用 - 字符
        if (lowerCaseEvent !== event && vm._events[lowerCaseEvent]) {
          tip(
            "Event \"" + lowerCaseEvent + "\" is emitted in component " +
            (formatComponentName(vm)) + " but the handler is registered for \"" + event + "\". " +
            "Note that HTML attributes are case-insensitive and you cannot use " +
            "v-on to listen to camelCase events when using in-DOM templates. " +
            "You should probably use \"" + (hyphenate(event)) + "\" instead of \"" + event + "\"."
          );
        }
      }
      // 从 vm._events 对象中获取指定事件的所有回调函数 
      var cbs = vm._events[event];
      if (cbs) {
        // 数组转换，类数组转换为 数组
        cbs = cbs.length > 1 ? toArray(cbs) : cbs;
        // this.$emit('custom-click', args1, args2)
        // 获取传入的附加参数 args = [arg1, arg2]
        var args = toArray(arguments, 1);
        var info = "event handler for \"" + event + "\"";
        for (var i = 0, l = cbs.length; i < l; i++) {
          // 执行回调函数
          invokeWithErrorHandling(cbs[i], vm, args, vm, info);
        }
      }
      return vm
    };
  }

  /*  */

  var activeInstance = null;
  var isUpdatingChildComponent = false;

  function setActiveInstance(vm) {
    var prevActiveInstance = activeInstance;
    activeInstance = vm;
    return function () {
      activeInstance = prevActiveInstance;
    }
  }

  function initLifecycle (vm) {
    var options = vm.$options;

    // locate first non-abstract parent
    // 找到第一个非抽象父节点
    var parent = options.parent;
    if (parent && !options.abstract) {
      while (parent.$options.abstract && parent.$parent) {
        parent = parent.$parent;
      }
      // 父组件的 $children 属性能访问子组件的实例
      parent.$children.push(vm);
    }

    // 子组件的 $parent 属性能访问父组件实例
    vm.$parent = parent;
    // 当前节点的根实例  自上而下将根实例 $root 属性依次传递给每一个子实例
    vm.$root = parent ? parent.$root : vm;

    vm.$children = [];
    vm.$refs = {};

    vm._watcher = null;
    vm._inactive = null;
    vm._directInactive = false;
    vm._isMounted = false;
    vm._isDestroyed = false;
    vm._isBeingDestroyed = false;
  }

  function lifecycleMixin (Vue) {
    // 组负责页面更新，页面首次渲染和后续更新的入口位置，也是 patch 的入口位置
    Vue.prototype._update = function (vnode, hydrating) {
      var vm = this;
      var prevEl = vm.$el;
      // 组件老的 VNode  oldVnode
      var prevVnode = vm._vnode;
      var restoreActiveInstance = setActiveInstance(vm);
      // 新的 VNode
      vm._vnode = vnode;
      // Vue.prototype.__patch__ is injected in entry points
      // based on the rendering backend used.
      if (!prevVnode) {
        // initial render
        // oldVnode 不存在
        // 首次渲染，页面初始化时走这
        // patch 阶段， patch、diff 算法
        vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */);
      } else {
        // oldVnode 存在，表示更新
        // updates
        // 响应式数据更新时，即页面更新时走这  
        // 老节点 和 新节点
        vm.$el = vm.__patch__(prevVnode, vnode);
      }
      restoreActiveInstance();
      // update __vue__ reference
      if (prevEl) {
        prevEl.__vue__ = null;
      }
      if (vm.$el) {
        vm.$el.__vue__ = vm;
      }
      // if parent is an HOC, update its $el as well
      if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
        vm.$parent.$el = vm.$el;
      }
      // updated hook is called by the scheduler to ensure that children are
      // updated in a parent's updated hook.
    };

    // 当实例依赖的数据发送变化时，会重新渲染
    // 直接调用 watch.update 方法，迫使组件重新渲染
    // 仅仅影响实力本身 和 插入插槽内容的子组件，而不是所有子组件
    Vue.prototype.$forceUpdate = function () {
      var vm = this;
      if (vm._watcher) {
        vm._watcher.update();
      }
    };

    /**
     * 完全销毁一个实例。清理它与其他实例的连接，解绑它的全部指令及事件监听器
     * 通常用的少； v-if 来控制即可
    */
    Vue.prototype.$destroy = function () {
      var vm = this;
      // _isBeingDestroyed: 当前实例是否处于被销毁的状态
      if (vm._isBeingDestroyed) {
        return
      }
      // 调用 beforeDestroy 钩子
      callHook(vm, 'beforeDestroy');
      // 标识实例已销毁
      vm._isBeingDestroyed = true;
      // remove self from parent
      var parent = vm.$parent;
      // 当前实例从 $parent （父级实例） 移除
      // !vm.$options.abstract: 不是抽象组件 
      if (parent && !parent._isBeingDestroyed && !vm.$options.abstract) {
        remove(parent.$children, vm);
      }
      // teardown watchers
      // 将实力自身从其他数据的依赖列表中删除
      if (vm._watcher) {
        // teardown：从所有依赖项的 Dep 列表中将自己删除
        vm._watcher.teardown();
      }
      // _watchers： 所有实例内的数据对其他数据的依赖都会存放在实例的 _watchers 中
      // 移除实例内数据对其他数据的依赖
      var i = vm._watchers.length;
      // 循环移除所有的 watcher
      while (i--) {
        vm._watchers[i].teardown();
      }
      // remove reference from data ob
      // frozen object may not have observer.
      // 移除实例内部响应式数据的引用
      if (vm._data.__ob__) {
        vm._data.__ob__.vmCount--;
      }
      // call the last hook...
      // _isDestroyed： 当前实例已被销毁
      vm._isDestroyed = true;
      // invoke destroy hooks on current rendered tree
      // 调用 __patch__，销毁节点，新节点置为 null
      vm.__patch__(vm._vnode, null);
      // fire destroyed hook
      // 调用 destroy 钩子
      callHook(vm, 'destroyed');
      // turn off all instance listeners.
      // 移除实例的所有事件监听
      vm.$off();
      // remove __vue__ reference
      if (vm.$el) {
        vm.$el.__vue__ = null;
      }
      // release circular reference (#6759)
      // 断开与父组件的联系
      if (vm.$vnode) {
        vm.$vnode.parent = null;
      }
    };
  }

  function mountComponent (
    vm,
    el,
    hydrating
  ) {
    vm.$el = el;
    if (!vm.$options.render) {
      vm.$options.render = createEmptyVNode;
      {
        /* istanbul ignore if */
        if ((vm.$options.template && vm.$options.template.charAt(0) !== '#') ||
          vm.$options.el || el) {
          warn(
            'You are using the runtime-only build of Vue where the template ' +
            'compiler is not available. Either pre-compile the templates into ' +
            'render functions, or use the compiler-included build.',
            vm
          );
        } else {
          warn(
            'Failed to mount component: template or render function not defined.',
            vm
          );
        }
      }
    }
    callHook(vm, 'beforeMount');

    var updateComponent;
    /* istanbul ignore if */
    if ( config.performance && mark) {
      updateComponent = function () {
        var name = vm._name;
        var id = vm._uid;
        var startTag = "vue-perf-start:" + id;
        var endTag = "vue-perf-end:" + id;

        mark(startTag);
        var vnode = vm._render();
        mark(endTag);
        measure(("vue " + name + " render"), startTag, endTag);

        mark(startTag);
        vm._update(vnode, hydrating);
        mark(endTag);
        measure(("vue " + name + " patch"), startTag, endTag);
      };
    } else {
      // 负责更新组件
      updateComponent = function () {
        // 执行 vm._render() 函数，得到 虚拟 DOM，并将 vnode 传递给 _update 方法，接下来就该到 patch 阶段了
        vm._update(vm._render(), hydrating);
      };
    }

    // we set this to vm._watcher inside the watcher's constructor
    // since the watcher's initial patch may call $forceUpdate (e.g. inside child
    // component's mounted hook), which relies on vm._watcher being already defined
    new Watcher(vm, updateComponent, noop, {
      before: function before () {
        if (vm._isMounted && !vm._isDestroyed) {
          callHook(vm, 'beforeUpdate');
        }
      }
    }, true /* isRenderWatcher */);
    hydrating = false;

    // manually mounted instance, call mounted on self
    // mounted is called for render-created child components in its inserted hook
    if (vm.$vnode == null) {
      vm._isMounted = true;
      callHook(vm, 'mounted');
    }
    return vm
  }

  function updateChildComponent (
    vm,
    propsData,
    listeners,
    parentVnode,
    renderChildren
  ) {
    {
      isUpdatingChildComponent = true;
    }

    // determine whether component has slot children
    // we need to do this before overwriting $options._renderChildren.

    // check if there are dynamic scopedSlots (hand-written or compiled but with
    // dynamic slot names). Static scoped slots compiled from template has the
    // "$stable" marker.
    var newScopedSlots = parentVnode.data.scopedSlots;
    var oldScopedSlots = vm.$scopedSlots;
    var hasDynamicScopedSlot = !!(
      (newScopedSlots && !newScopedSlots.$stable) ||
      (oldScopedSlots !== emptyObject && !oldScopedSlots.$stable) ||
      (newScopedSlots && vm.$scopedSlots.$key !== newScopedSlots.$key) ||
      (!newScopedSlots && vm.$scopedSlots.$key)
    );

    // Any static slot children from the parent may have changed during parent's
    // update. Dynamic scoped slots may also have changed. In such cases, a forced
    // update is necessary to ensure correctness.
    var needsForceUpdate = !!(
      renderChildren ||               // has new static slots
      vm.$options._renderChildren ||  // has old static slots
      hasDynamicScopedSlot
    );

    vm.$options._parentVnode = parentVnode;
    vm.$vnode = parentVnode; // update vm's placeholder node without re-render

    if (vm._vnode) { // update child tree's parent
      vm._vnode.parent = parentVnode;
    }
    vm.$options._renderChildren = renderChildren;

    // update $attrs and $listeners hash
    // these are also reactive so they may trigger child update if the child
    // used them during render
    vm.$attrs = parentVnode.data.attrs || emptyObject;
    vm.$listeners = listeners || emptyObject;

    // update props
    if (propsData && vm.$options.props) {
      toggleObserving(false);
      var props = vm._props;
      var propKeys = vm.$options._propKeys || [];
      for (var i = 0; i < propKeys.length; i++) {
        var key = propKeys[i];
        var propOptions = vm.$options.props; // wtf flow?
        props[key] = validateProp(key, propOptions, propsData, vm);
      }
      toggleObserving(true);
      // keep a copy of raw propsData
      vm.$options.propsData = propsData;
    }

    // update listeners
    listeners = listeners || emptyObject;
    var oldListeners = vm.$options._parentListeners;
    vm.$options._parentListeners = listeners;
    updateComponentListeners(vm, listeners, oldListeners);

    // resolve slots + force update if has children
    if (needsForceUpdate) {
      vm.$slots = resolveSlots(renderChildren, parentVnode.context);
      vm.$forceUpdate();
    }

    {
      isUpdatingChildComponent = false;
    }
  }

  function isInInactiveTree (vm) {
    while (vm && (vm = vm.$parent)) {
      if (vm._inactive) { return true }
    }
    return false
  }

  function activateChildComponent (vm, direct) {
    if (direct) {
      vm._directInactive = false;
      if (isInInactiveTree(vm)) {
        return
      }
    } else if (vm._directInactive) {
      return
    }
    if (vm._inactive || vm._inactive === null) {
      vm._inactive = false;
      for (var i = 0; i < vm.$children.length; i++) {
        activateChildComponent(vm.$children[i]);
      }
      callHook(vm, 'activated');
    }
  }

  function deactivateChildComponent (vm, direct) {
    if (direct) {
      vm._directInactive = true;
      if (isInInactiveTree(vm)) {
        return
      }
    }
    if (!vm._inactive) {
      vm._inactive = true;
      for (var i = 0; i < vm.$children.length; i++) {
        deactivateChildComponent(vm.$children[i]);
      }
      callHook(vm, 'deactivated');
    }
  }

  /**
   * callHook(vm, 'mounted')
   * 执行实例指定的生命周期钩子函数
   * 如果实例设置有对应的 Hook Event， 比如： <comp @hook:mounted = 'method' />，执行完生命周期函数，触发该事件
   * @param {*} vm 组件实例
   * @param {*} hook 生命周期钩子函数
  */
  function callHook (vm, hook) {
    // 在执行生命周期钩子函数期间禁止依赖收集
    // #7573 disable dep collection when invoking lifecycle hooks
    // 打开依赖收集
    pushTarget();
    // 从组件的配置项中获取这个 生命周期钩子函数
    var handlers = vm.$options[hook];
    var info = hook + " hook";
    if (handlers) {
      for (var i = 0, j = handlers.length; i < j; i++) {
        // 通过 invokeWithErrorHandling 方法调用生命周期函数
        invokeWithErrorHandling(handlers[i], vm, null, vm, info);
      }
    }
    // hook event
    /**
     * 你想给一个Vue组件添加生命周期函数有3个办法：
     * 在Vue组件选项中添加；
     * 在模板中通过 @hooks:created 这种形式；
     * vm.$on('hooks:created', cb) 或者 vm.$once('hooks:created', cb)。
    */
    // vm._hasHookEvent 标识组件是否有 hook event，在 vm.$on 中处理组件自定义事件中设置的
    if (vm._hasHookEvent) {
      // 通过 $emit 方法触发 hook：mounted 事件
      // 执行 vm._events['hook: mounted'] 数组当中的所有响应函数
      vm.$emit('hook:' + hook);
    }
    // 关闭依赖收集
    popTarget();
  }

  /*  */

  var MAX_UPDATE_COUNT = 100;

  var queue = [];
  var activatedChildren = [];
  var has = {};
  var circular = {};
  var waiting = false;
  var flushing = false;
  var index = 0;

  /**
   * Reset the scheduler's state.
   */
  function resetSchedulerState () {
    index = queue.length = activatedChildren.length = 0;
    has = {};
    {
      circular = {};
    }
    waiting = flushing = false;
  }

  // Async edge case #6566 requires saving the timestamp when event listeners are
  // attached. However, calling performance.now() has a perf overhead especially
  // if the page has thousands of event listeners. Instead, we take a timestamp
  // every time the scheduler flushes and use that for all event listeners
  // attached during that flush.
  var currentFlushTimestamp = 0;

  // Async edge case fix requires storing an event listener's attach timestamp.
  var getNow = Date.now;

  // Determine what event timestamp the browser is using. Annoyingly, the
  // timestamp can either be hi-res (relative to page load) or low-res
  // (relative to UNIX epoch), so in order to compare time we have to use the
  // same timestamp type when saving the flush timestamp.
  // All IE versions use low-res event timestamps, and have problematic clock
  // implementations (#9632)
  if (inBrowser && !isIE) {
    var performance = window.performance;
    if (
      performance &&
      typeof performance.now === 'function' &&
      getNow() > document.createEvent('Event').timeStamp
    ) {
      // if the event timestamp, although evaluated AFTER the Date.now(), is
      // smaller than it, it means the event is using a hi-res timestamp,
      // and we need to use the hi-res version for event listener timestamps as
      // well.
      getNow = function () { return performance.now(); };
    }
  }

  /**
   * Flush both queues and run the watchers.
   */
  /**
   * 刷新队列，由 flushCallbacks 函数负责调用，主要：
   *   1：更新 flushing 为 true，表示正在刷新队列，在此期间往队列中 push 新的 watcher 时需要特殊处理，将其放在队列合适的位置
   *   2：按照队列中的 watcher.id 从下到大排序，保证西安创建的 watcher 先执行，也配合第一步
   *   3：遍历 watcher 队列，依次执行 watcher.before、watcher.run，并清除缓存的 watcher
  */
  function flushSchedulerQueue () {
    currentFlushTimestamp = getNow();
    // 将 flushing 置为 true，表示现在的 watcher 队列正在被刷新
    flushing = true;
    var watcher, id;

    // Sort queue before flush.
    // This ensures that:
    // 1. Components are updated from parent to child. (because parent is always
    //    created before the child)
    // 2. A component's user watchers are run before its render watcher (because
    //    user watchers are created before the render watcher)
    // 3. If a component is destroyed during a parent component's watcher run,
    //    its watchers can be skipped.
    /** 
     * 刷新队列之前先给队列排序(升序),可以保证:
     *  1.组件的更新顺序为父级到子级,因为父组件总是在子组件之前被创建
     *  2.一个组件的用户 watcher 在其渲染 watcher 之前执行,因为用户 watcher 先于 渲染 watcher的创建
     *  3.如果一个组件在其父组件的 watch 执行期间销毁,则它的 watcher 可以跳过
     * 排序以后在刷新队列期间新进来的 watcher 也会按顺序放入队列的合适位置
     */
    queue.sort(function (a, b) { return a.id - b.id; });

    // do not cache length because more watchers might be pushed
    // as we run existing watchers
    // for 循环遍历 watcher 队列，依次执行 watcher 的 run 方法
    // 这里直接使用了 queue.length，动态计算队列的长度，没有缓存长度，是因为在执行现有 watcher 期间队列中可能会被 push 进新的 watcher
    for (index = 0; index < queue.length; index++) {
      // 拿出当前索引 watcher
      watcher = queue[index];
      // 首先执行 before 钩子
      if (watcher.before) {
        // 使用 vm.$watch 或者 watch 选项时可以通过配置项（options.before）传递
        watcher.before();
      }
      // 清空缓存，表示当前 watcher 已经被执行，当该 watcher 再次入队时就可以进来
      id = watcher.id;
      has[id] = null;
      // 执行 watcher 的 run 方法
      watcher.run();
      // in dev build, check and stop circular updates.
      if ( has[id] != null) {
        circular[id] = (circular[id] || 0) + 1;
        if (circular[id] > MAX_UPDATE_COUNT) {
          warn(
            'You may have an infinite update loop ' + (
              watcher.user
                ? ("in watcher with expression \"" + (watcher.expression) + "\"")
                : "in a component render function."
            ),
            watcher.vm
          );
          break
        }
      }
    }

    // keep copies of post queues before resetting state
    var activatedQueue = activatedChildren.slice();
    var updatedQueue = queue.slice();

    resetSchedulerState();

    // call component updated and activated hooks
    callActivatedHooks(activatedQueue);
    callUpdatedHooks(updatedQueue);

    // devtool hook
    /* istanbul ignore if */
    if (devtools && config.devtools) {
      devtools.emit('flush');
    }
  }

  function callUpdatedHooks (queue) {
    var i = queue.length;
    while (i--) {
      var watcher = queue[i];
      var vm = watcher.vm;
      if (vm._watcher === watcher && vm._isMounted && !vm._isDestroyed) {
        callHook(vm, 'updated');
      }
    }
  }

  /**
   * Queue a kept-alive component that was activated during patch.
   * The queue will be processed after the entire tree has been patched.
   */
  function queueActivatedComponent (vm) {
    // setting _inactive to false here so that a render function can
    // rely on checking whether it's in an inactive tree (e.g. router-view)
    vm._inactive = false;
    activatedChildren.push(vm);
  }

  function callActivatedHooks (queue) {
    for (var i = 0; i < queue.length; i++) {
      queue[i]._inactive = true;
      activateChildComponent(queue[i], true /* true */);
    }
  }

  /**
   * Push a watcher into the watcher queue.
   * Jobs with duplicate IDs will be skipped unless it's
   * pushed when the queue is being flushed.
   */
  // 将 watcher 放入 watcher 队列
  function queueWatcher (watcher) {
    var id = watcher.id;
    // 判重， watcher 不会重复入队
    if (has[id] == null) {
      // 缓存一下，置为 true，用于判断是否已经入队
      has[id] = true;
      if (!flushing) {
        // 如果 flushing = false，表示当前 watcher 队列没有处于刷新，watcher 直接入队
        queue.push(watcher);
      } else {
        // watcher 队列已经在被刷新了，这时候这个 watcher 入队就需要特殊操作一下
        // 保证 watcher 入队后，刷新中的 watcher 队列仍然是有序的
        // 从队列尾开始倒序遍历，根据当前 watcher.id
        // if already flushing, splice the watcher based on its id
        // if already past its id, it will be run next immediately.
        var i = queue.length - 1;
        while (i > index && queue[i].id > watcher.id) {
          i--;
        }
        queue.splice(i + 1, 0, watcher);
      }
      // queue the flush
      if (!waiting) {
        // waiting 为 false 走这里，表示当前浏览器的异步任务队列中没有 flushSchedulerQueue 函数
        waiting = true;

        if ( !config.async) {
          // 同步执行，直接去刷新 watcher 队列
          // 一般不会走到这，Vue 默认是异步执行；改为同步，性能大打折扣
          flushSchedulerQueue();
          return
        }
        // this.$nextTick 或者 Vue.nextTick
        // 将回调函数（flushSchedulerQueue）放入 callbacks 数组
        // 通过 pending 控制向浏览器任务队列中添加 flushCallbacks 函数
        nextTick(flushSchedulerQueue);
      }
    }
  }

  /*  */



  var uid$1 = 0;

  /**
   * A watcher parses an expression, collects dependencies,
   * and fires callback when the expression value changes.
   * This is used for both the $watch() api and directives.
   */
  // 订阅者
  /**
   * 一个组件一个 watcher (渲染 watcher) 或者一个表达式一个 watcher （用户 watcher）
   * 当数据更新时 watcher 会触发，访问 this.computedProperty 时也会触发 watcher
  */
  var Watcher = function Watcher (
    // Vue 实例化对象
    vm,
    // 要监听的数据，可谓为字符串：要观察的数据路径；或函数结果返回要观察的数据
    expOrFn,
    // 回调函数，当监听的数据发生变化时调用
    cb,
    // 配置项
    options,
    // true：创建的 Watcher 是渲染 Watcher
    isRenderWatcher
  ) {
    this.vm = vm;
    // 渲染 Watcher
    if (isRenderWatcher) {
      vm._watcher = this;
    }
    // _watchers 是一个 Watcher 的集合，缓存 Watcher
    vm._watchers.push(this);
    // options
    if (options) {
      this.deep = !!options.deep;
      this.user = !!options.user;
      this.lazy = !!options.lazy;
      this.sync = !!options.sync;
      this.before = options.before;
    } else {
      this.deep = this.user = this.lazy = this.sync = false;
    }
    this.cb = cb;
    this.id = ++uid$1; // uid for batching
    this.active = true;
    this.dirty = this.lazy; // for lazy watchers
    // 表示 Watcher 持有的 Dep 的数组集合，Dep 专门收集并管理订阅者
    this.deps = [];
    this.newDeps = [];
    // 表示 this.deps 和 this.newDeps 中 Dep 的标识符 id 的 Set 集合
    this.depIds = new _Set();
    this.newDepIds = new _Set();
    this.expression =  expOrFn.toString()
      ;
    // parse expression for getter
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn;
    } else {
      /**
       * this.getter = () => { return this.xxx }
       * 在 this.get 中执行 this.getter 时触发依赖收集
       * 待后续 this.xxx 更新时会触发响应
      */
      // 传递 key 进来，this.key， 传递进来可能是个字符串，转换成函数
      this.getter = parsePath(expOrFn);
      if (!this.getter) {
        this.getter = noop;
         warn(
          "Failed watching path: \"" + expOrFn + "\" " +
          'Watcher only accepts simple dot-delimited paths. ' +
          'For full control, use a function instead.',
          vm
        );
      }
    }
    this.value = this.lazy
      ? undefined
      : this.get();
  };

  /**
   * Evaluate the getter, and re-collect dependencies.
   */
  // 为什么要重新收集依赖？
  // 因为触发更新说明有响应式数据被更新啦，但是被更新的数据虽然已经经过 observe 观察了，但是却没有依赖收集
  // 在更新页面时，会重新执行一次 render 函数
  // 触发 updateComputed 的执行，进行组件更新，进入 patch 阶段
  // 更新组件时先执行 render 生成 VNode，期间触发读取操作，进行依赖收集
  Watcher.prototype.get = function get () {
    // 什么情况 执行更新
    // 对新值进行依赖收集
    // Dep.target = this
    pushTarget(this);
    // value 为回调函数执行的结果
    var value;
    var vm = this.vm;
    try {
      // 执行实例化 watcher 是传递进来的第二个参数：
      // 有可能是一个函数，比如 实例化渲染 watcher 时传递的 updateComputed 函数
      // 用户 watcher，可能传递的是一个 key，也可能是读取 this.key 的函数
      // 触发读取操作,被 setter 拦截,进行依赖收集
      value = this.getter.call(vm, vm);
    } catch (e) {
      if (this.user) {
        handleError(e, vm, ("getter for watcher \"" + (this.expression) + "\""));
      } else {
        throw e
      }
    } finally {
      // "touch" every property so they are all tracked as
      // dependencies for deep watching
      // 深度监听
      if (this.deep) {
        traverse(value);
      }
      // 关闭 Dep.target，Dep.target = null
      popTarget();
      this.cleanupDeps();
    }
    return value
  };

  /**
   * Add a dependency to this directive.
   */
  // 将 dep 放到 watcher 中
  Watcher.prototype.addDep = function addDep (dep) {
    var id = dep.id;
    // 判重，已经收集则跳过
    if (!this.newDepIds.has(id)) {
      // 缓存 dep.id，用于判重
      this.newDepIds.add(id);
      // 添加 dep
      this.newDeps.push(dep);
      // 避免在 dep 中重复添加 watcher，this.depIds 的设置在 cleanupDeps 方法中
      if (!this.depIds.has(id)) {
        // 将 watcher 自己放到 dep 中， 来了个双向收集
        dep.addSub(this);
      }
    }
  };

  /**
   * Clean up for dependency collection.
   * 移除无用的发布者，通知发布者移除订阅者
   */
  Watcher.prototype.cleanupDeps = function cleanupDeps () {
    var i = this.deps.length;
    while (i--) {
      var dep = this.deps[i];
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this);
      }
    }
    var tmp = this.depIds;
    this.depIds = this.newDepIds;
    this.newDepIds = tmp;
    this.newDepIds.clear();
    tmp = this.deps;
    this.deps = this.newDeps;
    this.newDeps = tmp;
    this.newDeps.length = 0;
  };

  /**
   * Subscriber interface.
   * Will be called when a dependency changes.
   */
  // 根据 watcher 配置项，决定下一步怎么走，一般是 queueWatcher
  Watcher.prototype.update = function update () {
    /* istanbul ignore else */
    if (this.lazy) {
      // 赖执行时走到这，比如 computed
      // 将 dirty 置为 true，在组件更新之后，当响应式数据再次被更新时，执行 computed getter
      // 重新执行 computed 回调函数，计算新值，然后缓存到 watcher.value
      this.dirty = true;
    } else if (this.sync) {
      // 同步执行
      // 比如： this.$watch() 或者 watch 选项时，传递一个 sync 配置，比如 { sync: true }
      // 当为 true 时，数据更新该 watcher 就不走异步更新队列，直接执行 this.run 方法更新
      // 这个属性在官方文档中没有出现
      this.run();
    } else {
      // 将当前 watcher 放入 watcher 队列，一般会走这
      queueWatcher(this);
    }
  };

  /**
   * Scheduler job interface.
   * Will be called by the scheduler.
   */
  /**
   *由 刷新队列函数 flushSchedulerQueue 调用，完成如下几件事：
   * 1、执行实例化 watcher 传递的第二个参数，updateComponent 或者 获取 this.xx 的一个函数(parsePath 返回的函数)
   * 2、更新旧值为新值
   * 3、执行实例化 watcher 时传递的第三个参数，比如用户 watcher 的回调函数
  */
  Watcher.prototype.run = function run () {
    // active：实例对象来判断订阅者是否被销毁，默认为 true；销毁时 置为 false
    if (this.active) {
      // 执行 get
      var value = this.get();
      if (
        value !== this.value ||
        // Deep watchers and watchers on Object/Arrays should fire even
        // when the value is the same, because the value may
        // have mutated.
        isObject(value) ||
        this.deep
      ) {
        // set new value
        // 更新旧值为新增
        var oldValue = this.value;
        this.value = value;
        if (this.user) {
          // 用户 watcher，再执行一下 watch 回调
          var info = "callback for watcher \"" + (this.expression) + "\"";
          invokeWithErrorHandling(this.cb, this.vm, [value, oldValue], this.vm, info);
        } else {
          // 渲染 watcher，this.cb = noop， 一个空函数
          this.cb.call(this.vm, value, oldValue);
        }
      }
    }
  };

  /**
   * Evaluate the value of the watcher.
   * This only gets called for lazy watchers.
   */
  /**
   * 懒执行 watcher 会调用该方法
   *比如：computed，在获取 vm.computedProperty 的值时会调用该方法
   * 执行 this.get，即 watcher 的回调函数，得到返回值
   * this.dirty 被置为 false，页面在本次渲染中只会一次 computed.key 的回调函数
   *computed 和 methods 区别之一： computed 有缓存的原理
   * 页面更新之后 this.dirty 被重新置为 true，在 this.update 方法中完成
  */
  Watcher.prototype.evaluate = function evaluate () {
    this.value = this.get();
    this.dirty = false;
  };

  /**
   * Depend on all deps collected by this watcher.
   */
  Watcher.prototype.depend = function depend () {
    var i = this.deps.length;
    while (i--) {
      this.deps[i].depend();
    }
  };

  /**
   * Remove self from all dependencies' subscriber list.
   */
  /**
   * 1：从全局 Watcher 集合 this.vm._watchers 中移除订阅者
   * 2：去除订阅者订阅的发布者中移除该订阅者
  */
  Watcher.prototype.teardown = function teardown () {
    if (this.active) {
      // remove self from vm's watcher list
      // this is a somewhat expensive operation so we skip it
      // if the vm is being destroyed.
      // _isBeingDestroyed 是 Vue 实例是否被销毁的标志；true： 已销毁
      if (!this.vm._isBeingDestroyed) {
        // 从 _watchers 删除 指定的 Watcher
        remove(this.vm._watchers, this);
      }
      var i = this.deps.length;
      while (i--) {
        this.deps[i].removeSub(this);
      }
      this.active = false;
    }
  };

  /*  */

  // 定义 默认的属性描述符
  var sharedPropertyDefinition = {
    enumerable: true,
    configurable: true,
    get: noop,
    set: noop
  };

  // 将 key 代理到 vue 实例上
  function proxy (target, sourceKey, key) {
    sharedPropertyDefinition.get = function proxyGetter () {
      // this._props.key
      return this[sourceKey][key]
    };
    sharedPropertyDefinition.set = function proxySetter (val) {
      this[sourceKey][key] = val;
    };
    // 拦截对 this.key 的访问
    Object.defineProperty(target, key, sharedPropertyDefinition);
  }

  // 响应式原理的入口，分别处理 props、methods、data、computed、watch
  // 优先级： props、methods、data、computed 对象中的属性不能出现重复，优先级和列出顺序一致
  function initState (vm) {
    //  Vue2.0 起，侦测粒度为组件层面，其中一个状态发生变化，会通知到组件，然后组件内部使用虚拟 DOM 进行数据比对
    // 新增 _watchers，保存当前组件中所有的 watcher 实例
    vm._watchers = [];
    var opts = vm.$options;
    // 对 prop 配置做响应式处理
    // 代理 props 配置上的 key 到 vue 实例，支持 this.propKey 的方式访问
    if (opts.props) { initProps(vm, opts.props); }
    // 判重处理： methods 对象中定义的属性不能和 props 对象中的属性重复， props 优先级 > methods 的优先级
    // 将 methods 中的配置赋值到 vue 实例上， 支持通过 this.methodsKey 的方式访问方法
    if (opts.methods) { initMethods(vm, opts.methods); }
    // data 在 props 后初始化，data 中可以使用 props 中的数据
    if (opts.data) {
      // 判重处理： data 中的属性不能和 props 以及 methods 中的属性重复
      // 代理： 将 data 中的属性代理到 vue 实例上，支持通过 this.key 的方式访问
      // 响应式
      initData(vm);
    } else {
      // 不存在 直接使用 observe 观察空对象
      observe(vm._data = {}, true /* asRootData */);
    }
    // computed 是通过 watcher 来实现的，对每一个 computedKey 实例化一个 watcher，默认懒执行
    // 将 computedKey 代理到 vue 实例上，支持通过 this.computedKey 的方式访问 computed.key
    // 判重, computed 中的 key 不能和 data、props 中的属性重复
    // 注意理解 computed 缓存的实现原理
    if (opts.computed) { initComputed(vm, opts.computed); }
    // watch 在 props 和 data 后面初始化，所以 watch 中可以观察 props 和 data
    // opts.watch !== nativeWatch  避免 Fireox 浏览器中的 Object.prototype 上有一个 watch方法。当用户没有设置 watch 时，避免 opts。watch 会是 Object.prototype.watch 函数
    if (opts.watch && opts.watch !== nativeWatch) {
      // 核心：实例化一个 watcher 实例，并返回一个 unwatch
      initWatch(vm, opts.watch);
    }
    // computed 和 watch 有什么区别
    // computed 默认懒执行，且不可更改，但是 watch 可配置
    // 使用场景不同
  }

  // 处理 props 对象，为 props 对象的每一个属性设置响应式，并将其代理到 vm 实例上
  function initProps (vm, propsOptions) {
    // propsOptions： 规格化之后的 props 选项  详情见： normalizeProps 方法
    // 保存通过父组件或用户通过 propData 传入的真实 props 数据
    var propsData = vm.$options.propsData || {};
    // 指向 vm._props 的指针，所有设置到 props 变量中的属性都会保存到 vm._props 中
    var props = vm._props = {};
    // cache prop keys so that future props updates can iterate using Array
    // instead of dynamic object key enumeration.
    // 缓存 props 的每个 key，性能优化。将来更新 props 时，只需要遍历 vm.$options._propKeys 数组即可
    var keys = vm.$options._propKeys = [];
    // 判断是否是根组件
    var isRoot = !vm.$parent;
    // root instance props should be converted
    // root 实例的 props 属性应该被转换成响应式数据；不是根实例，不需要转换
    if (!isRoot) {
      // toggleObserving: 用来控制数据转换成响应式
      toggleObserving(false);
    }
    var loop = function ( key ) {
      // 缓存 key
      keys.push(key);
      // 验证 prop，不存在默认值替换，类型为 bool，则变换成 true 或 false，当时用 default 中默认值时，会将默认值的副本 observe
      var value = validateProp(key, propsOptions, propsData, vm);
      /* istanbul ignore else */
      {
        // 不能是保留属性： key，ref，slot，slot-scope，is
        var hyphenatedKey = hyphenate(key);
        if (isReservedAttribute(hyphenatedKey) ||
            config.isReservedAttr(hyphenatedKey)) {
          warn(
            ("\"" + hyphenatedKey + "\" is a reserved attribute and cannot be used as component prop."),
            vm
          );
        }
        defineReactive(props, key, value, function () {
          if (!isRoot && !isUpdatingChildComponent) {
            warn(
              "Avoid mutating a prop directly since the value will be " +
              "overwritten whenever the parent component re-renders. " +
              "Instead, use a data or computed property based on the prop's " +
              "value. Prop being mutated: \"" + key + "\"",
              vm
            );
          }
        });
      }
      // static props are already proxied on the component's prototype
      // during Vue.extend(). We only need to proxy props defined at
      // instantiation here.
      // 代理 this.propsKey
      if (!(key in vm)) {
        proxy(vm, "_props", key);
      }
    };

    for (var key in propsOptions) loop( key );
    toggleObserving(true);
  }

  /**
   * 1：判重
   * 2：将 data[key] 代理到 Vue 实例上
   * 3：为 data 数据设置响应式
  */
  function initData (vm) {
    var data = vm.$options.data;
    // 将变量data作为指针指向vm._data
    // 保证后续处理的 data 是一个对象
    data = vm._data = typeof data === 'function'
      ? getData(data, vm)
      : data || {};
    if (!isPlainObject(data)) {
      data = {};
       warn(
        'data functions should return an object:\n' +
        'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
        vm
      );
    }
    // proxy data on instance
    var keys = Object.keys(data);
    var props = vm.$options.props;
    var methods = vm.$options.methods;
    var i = keys.length;
    while (i--) {
      var key = keys[i];
      // 判重处理： data 中属性 不能和 props 和 methods 中的属性重复
      {
        if (methods && hasOwn(methods, key)) {
          warn(
            ("Method \"" + key + "\" has already been defined as a data property."),
            vm
          );
        }
      }
      if (props && hasOwn(props, key)) {
         warn(
          "The data property \"" + key + "\" is already declared as a prop. " +
          "Use prop default value instead.",
          vm
        );
        // 过滤 不是以 $ 或 _ 开头的
      } else if (!isReserved(key)) {
        // 代理，代理 data 中的属性到 vue 实例，支持通过 this.key 的方式访问
        proxy(vm, "_data", key);
      }
    }
    // observe data
    // 响应式处理
    observe(data, true /* asRootData */);
  }

  function getData (data, vm) {
    // #7573 disable dep collection when invoking data getters
    pushTarget();
    try {
      return data.call(vm, vm)
    } catch (e) {
      handleError(e, vm, "data()");
      return {}
    } finally {
      popTarget();
    }
  }

  var computedWatcherOptions = { lazy: true };

  /**
   * 1：为 computed[key] 创建 watcher 实例，默认是懒加载
   * 2：代理 computed[key] 到 Vm 实例
   * 3：判重
   * compute = {
   *   key1: () => { return x }
   *   key2: {
   *      get: () => { return x }
   *      set: () => {}
   *   }
   * }
  */
  function initComputed (vm, computed) {
    // $flow-disable-line
    // Object.create(null) 创建出来的对象没有原型，不存在 __proto__ 属性
    var watchers = vm._computedWatchers = Object.create(null);
    // computed properties are just getters during SSR
    // 计算属性在 SSR 环境中，只是一个普通的 getter 方法
    var isSSR = isServerRendering();

    // 遍历 computed 对象
    for (var key in computed) {
      // 获取 kye 对应的值
      var userDef = computed[key];
      // 获取 getter 函数
      var getter = typeof userDef === 'function' ? userDef : userDef.get;
      // 如果没有取值器
      if ( getter == null) {
        warn(
          ("Getter is missing for computed property \"" + key + "\"."),
          vm
        );
      }

      // 在非 SSR 环境中，为计算属性创建内部观察器
      if (!isSSR) {
        // create internal watcher for the computed property.
        // 实例化一个 watch ,所以 computed 其实就是通过 watcher 来实现的 
        watchers[key] = new Watcher(
          vm,
          // getter 函数
          getter || noop,
          noop,
          // 配置项， computed 默认是 懒加载
          computedWatcherOptions
        );
      }

      // component-defined computed properties are already defined on the
      // component prototype. We only need to define computed properties defined
      // at instantiation here.
      if (!(key in vm)) {
        // 代理 computed 对象中的属性到 vm 实例上，可以使用 this.computedKey 访问
        defineComputed(vm, key, userDef);
      } else {
        // 不能与 data 、 props 、 methods 重名，重名不会定义计算属性
        if (key in vm.$data) {
          warn(("The computed property \"" + key + "\" is already defined in data."), vm);
        } else if (vm.$options.props && key in vm.$options.props) {
          warn(("The computed property \"" + key + "\" is already defined as a prop."), vm);
        } else if (vm.$options.methods && key in vm.$options.methods) {
          warn(("The computed property \"" + key + "\" is already defined as a method."), vm);
        }
      }
    }
  }

  // 代理 computed 对象中的 key 到 vm 上
  function defineComputed (
    target,
    key,
    userDef
  ) {
    // 非服务端 计算属性才缓存  shouldCache：true
    var shouldCache = !isServerRendering();
    // 构造属性描述符（get、set）
    if (typeof userDef === 'function') {
      sharedPropertyDefinition.get = shouldCache
        ? createComputedGetter(key)
        : createGetterInvoker(userDef);
      sharedPropertyDefinition.set = noop;
    } else {
      sharedPropertyDefinition.get = userDef.get
      // cache 废弃选项 默认为 true
        ? shouldCache && userDef.cache !== false
          ? createComputedGetter(key)
          : createGetterInvoker(userDef.get)
        : noop;
      sharedPropertyDefinition.set = userDef.set || noop;
    }
    if (
        sharedPropertyDefinition.set === noop) {
      // 没有设置 setter，对计算属性进行修改
      sharedPropertyDefinition.set = function () {
        warn(
          ("Computed property \"" + key + "\" was assigned to but it has no setter."),
          this
        );
      };
    }
    // 将 computed 配置中的 key 代理到 vue实例上,支持通过 this.computedKey 的方式访问 computed 中属性
    Object.defineProperty(target, key, sharedPropertyDefinition);
  }

  // 返回一个函数，在访问 vm.computedProperty 时会被执行，然后返回执行结果
  function createComputedGetter (key) {
    // computed 属性值会缓存的原理也是在这里结合 watcher.dirty、watcher.evaluate、watcher.update 实现的
    return function computedGetter () {
      // 拿到 watcher  this._computedWatchers 属性保存了所有计算属性的 watcher 实例
      var watcher = this._computedWatchers && this._computedWatchers[key];
      if (watcher) {
        // 执行 watcher.evaluate 方法
        // 执行 computed.key 的值(函数)得到函数的执行结果，赋值给 watcher.value
        // 将 watcher.dirty 置为 false
        // computed 和 methods 有什么区别
        // 一次渲染当中，只执行一次 computed 函数，后续的访问就不再执行了，直到下一次更新之后，才会再执行
        if (watcher.dirty) {
          // watcher.dirty 属性用于标识计算属性的返回值是否有变化
          // true： 所依赖的状态发生了改变
          watcher.evaluate();
        }
        if (Dep.target) {
          // 将读取计算属性的 watcher 添加到计算属性所依赖的所有状态的依赖列表中
          // 让计算属性的 watcher 持续观察计算属性所依赖的状态的变化
          watcher.depend();
        }
        return watcher.value
      }
    }
  }

  function createGetterInvoker(fn) {
    return function computedGetter () {
      return fn.call(this, this)
    }
  }

  /**
   * 1：校验 methods[kye]，是否是函数
   * 2：判重
   * 将 methods[key] 赋值到 vm 实例上,得到 vm[key] = methods[key]
  */
  function initMethods (vm, methods) {
    var props = vm.$options.props;
    // 判重， methods 中的 key 不能和 props 中的 key 重复。 props 中的优先级高于 methods
    for (var key in methods) {
      {
        // 检验是否是个函数
        if (typeof methods[key] !== 'function') {
          warn(
            "Method \"" + key + "\" has type \"" + (typeof methods[key]) + "\" in the component definition. " +
            "Did you referenc e the function correctly?",
            vm
          );
        }
        // 检验 是否和 props 中同名
        if (props && hasOwn(props, key)) {
          warn(
            ("Method \"" + key + "\" has already been defined as a prop."),
            vm
          );
        }
        // 检查 是否和 Vue 实例上已有的方法重叠,一般是一些内置的方法,比如以 $ 或 _ 开头的
        if ((key in vm) && isReserved(key)) {
          warn(
            "Method \"" + key + "\" conflicts with an existing Vue instance method. " +
            "Avoid defining component methods that start with _ or $."
          );
        }
      }
      // 将 methods 中的所有方法赋值到 vue 实例上，支持通过 this.methodKey 的方式访问定义的方法
      vm[key] = typeof methods[key] !== 'function' ? noop : bind(methods[key], vm);
    }
  }

  /**
   * 1：遍历 watch 对象
   * 2：调用 createWatcher 函数
   * watch = {
   *   'key1': (val, oldVal) => {}
   *   'key2': 'this.methodName',
   *   'key3': {
   *      handler: (val, oldVal) => {},
   *      deep: true
   *    },
   *   'key4': [
   *     'this.methodName',
   *     () => {},
   *     {}
   *    ],
   *   'key.key5': {} 
   * }
  */
  function initWatch (vm, watch) {
    // 遍历 watch 配置项
    for (var key in watch) {
      var handler = watch[key];
      if (Array.isArray(handler)) {
        // 为数组的情况
        for (var i = 0; i < handler.length; i++) {
          createWatcher(vm, key, handler[i]);
        }
      } else {
        createWatcher(vm, key, handler);
      }
    }
  }

  /**
   * 兼容性处理,保证是个函数
   * 调用 $watch
  */
  function createWatcher (
    vm,
    // 表达式或计算属性函数
    expOrFn,
    // watch 对象的值
    handler,
    // 用于传递给 vm.$watch 的选项对象
    options
  ) {
    // 如果是对象 从 handler 属性获取 函数
    if (isPlainObject(handler)) {
      options = handler;
      handler = handler.handler;
    }
    // 如果是字符串，表示的是一个 methods 方法，直接通过 this.methodsKey 的方式拿到函数
    if (typeof handler === 'string') {
      handler = vm[handler];
    }
    return vm.$watch(expOrFn, handler, options)
  }

  function stateMixin (Vue) {
    // flow somehow has problems with directly declared definition object
    // when using Object.defineProperty, so we have to procedurally build up
    // the object here.
    // 处理 data 数据，定义 get 方法，访问 this._data
    var dataDef = {};
    dataDef.get = function () { return this._data };
    // 处理 props 数据
    var propsDef = {};
    propsDef.get = function () { return this._props };
    // 异常提示
    {
      dataDef.set = function () {
        warn(
          'Avoid replacing instance root $data. ' +
          'Use nested data properties instead.',
          this
        );
      };
      // 只读
      propsDef.set = function () {
        warn("$props is readonly.", this);
      };
    }

    // 将 $data 和 $props 挂载到 Vue 原型链，支持通过 this.$data 和 this.$props 访问
    Object.defineProperty(Vue.prototype, '$data', dataDef);
    Object.defineProperty(Vue.prototype, '$props', propsDef);

    // this.$set 和 this.$delete
    // Vue.set 和 Vue.delete 别名
    Vue.prototype.$set = set;
    Vue.prototype.$delete = del;


    // // 键路径
    // vm.$watch('a.b.c', function (newVal, oldVal) {
    //   // 做点什么
    // })
    // // 函数
    // vm.$watch(
    //   function () {
    //     // 表达式 `this.a + this.b` 每次得出一个不同的结果时
    //     // 处理函数都会被调用。
    //     // 这就像监听一个未被定义的计算属性
    //     return this.a + this.b
    //   },
    //   function (newVal, oldVal) {
    //     // 做点什么
    //   }
    // )
    /**
     * 创建 watcher，返回 unwatch：
     *   1：兼容性处理，保证 new Watcher 时的 cb 为函数
     *   2：标记用户 watcher
     *   3：创建 watcher 实例
     *   4：如果设置了 immediate，则立即执行 cb
     *   5：返回 unwatch
    */
    Vue.prototype.$watch = function (
      // key
      expOrFn,
      // 回调函数
      cb,
      // 配置项
      options
    ) {
      var vm = this;
      // 兼容性处理，用户调用 vm.$watch 时设置的 cb 可能是个对象；处理 cb 是对象的情况，保证后续处理中 cb 肯定是个函数
      // this.$watch()
      if (isPlainObject(cb)) {
        return createWatcher(vm, expOrFn, cb, options)
      }
      // options.user 表示用户 watcher，还有渲染 watcher，即 updateComponent 方法中实例化的 watcher
      options = options || {};
      // 标记，这是个用户 watcher
      options.user = true;
      // 实例化 watcher
      var watcher = new Watcher(vm, expOrFn, cb, options);
      // 存在 immediate，则立即执行回调函数
      if (options.immediate) {
        var info = "callback for immediate watcher \"" + (watcher.expression) + "\"";
        pushTarget();
        invokeWithErrorHandling(cb, vm, [watcher.value], vm, info);
        popTarget();
      }
      // 返回一个 unwatch，用于解除监听
      return function unwatchFn () {
        watcher.teardown();
      }
    };
  }

  /*  */

  var uid$2 = 0;

  function initMixin (Vue) {
    // 负责 Vue 的初始化过程
    Vue.prototype._init = function (options) {
      //  Vue 实例
      var vm = this;
      // a uid
      // 每个 Vue 实例都有一个 _uid， 并且依次递增
      vm._uid = uid$2++;

      // a flag to avoid this being observed
      vm._isVue = true;
      // 处理组件配置项
      // merge options
      if (options && options._isComponent) {
        // optimize internal component instantiation
        // since dynamic options merging is pretty slow, and none of the
        // internal component options needs special treatment.
        /**
        * 每个子组件初始化，做性能优化处理
        * 将组件配置对象上的一些深层次属性放到 vm.$options 选项中,减少原型链的动态查找，以提高代码的执行效率
        */
        initInternalComponent(vm, options);
      } else {
        // 根组件走这里  选项合并，将全局配置选项合并到根组件的局部配置上
        // 组件选项合并，发生在三个地方：
       /**
        *  1. Vue.component(CompName, Comp) 做了选项合并，
        * 合并 Vue 内置的全局组件（keep-alive、transition、transition-group）和用户自己注册的全局组件，最终都会合并到 全局的 components 选项中 --- 全局 API
        * 2. 子组件内部： { components: { xxx }}, 局部注册，执行编译器生成的 render 函数做了合并，会合并全局配置项到组件局部配置项上 --- 编译器
        * 3. 这里的根组件情况
        */
        vm.$options = mergeOptions(
          resolveConstructorOptions(vm.constructor),
          options || {},
          vm
        );
      }
      /* istanbul ignore else */
      {
        // 代理处理，将 vm 实例上的属性代理到 vm._renderProxy
        initProxy(vm);
      }
      // expose real self
      vm._self = vm;

      // 重点： 核心

      // 初始化组件实例关系属性，比如 $parent,$children,$root,$refs 等
      initLifecycle(vm);
      // 初始化自定义事件
      // 组件上事件的监听其实是子组件自己在监听， 谁触发谁监听，事件的派发和监听者都是子组件本身
      initEvents(vm);
      // 初始化插槽，获取 this.$slots，定义 this._c ，即 createdElement 方法，平时使用的 h 函数
      initRender(vm);
      // 执行 beforeCreated 生命周期函数
      callHook(vm, 'beforeCreate');
      // 初始化 inject 选项：得到 result[key] = val 形式的配置项，并做响应式处理
      initInjections(vm); // resolve injections before data/props
      // 响应式原理的核心，处理 props、methods、computed、data、watch 等选项
      initState(vm);
      // 处理 provide 选项
      // 总结 provide、inject 的实现原理 
      // inject 主动去祖代组件 provide 中找数据，并不是 provide 注入，inject 使用
      initProvide(vm); // resolve provide after data/props
      // 调用 created 生命周期函数
      callHook(vm, 'created');

      // 如果存在 el 选项，自动执行 $mount  开启模板编译和挂载阶段
      // 如果没有传递 el 选项，需要手动执行 vm.$mount 方法，开启模板编译和挂载阶段
      if (vm.$options.el) {
        vm.$mount(vm.$options.el);
      }
    };
  }

  // 性能优化 打平配置项上的属性，减少运行时原型链的查找，提高执行效率
  function initInternalComponent (vm, options) {
    // 基于 构造函数 上的配置对象创建 vm.$options
    var opts = vm.$options = Object.create(vm.constructor.options);
    // doing this because it's faster than dynamic enumeration.
    // 这样做是因为比动态枚举更快
    var parentVnode = options._parentVnode;
    opts.parent = options.parent;
    opts._parentVnode = parentVnode;

    // 避免原型链的动态查找
    // 将配置对象的属性取出来赋值到 $options
    var vnodeComponentOptions = parentVnode.componentOptions;
    opts.propsData = vnodeComponentOptions.propsData;
    opts._parentListeners = vnodeComponentOptions.listeners;
    opts._renderChildren = vnodeComponentOptions.children;
    opts._componentTag = vnodeComponentOptions.tag;

    // 有 render 函数，将其赋值到 vm.$options
    if (options.render) {
      opts.render = options.render;
      opts.staticRenderFns = options.staticRenderFns;
    }
  }

  // 从组件构造函数上解析配置项 options，并合并基类选项
  function resolveConstructorOptions (Ctor) {
    // 从实例函数上获取选项
    var options = Ctor.options;
    if (Ctor.super) {
      // 存在基类，递归解析基类构造函数的选项
      var superOptions = resolveConstructorOptions(Ctor.super);
      // 缓存
      var cachedSuperOptions = Ctor.superOptions;
      if (superOptions !== cachedSuperOptions) {
        // 说明基类的配置项发生了改变，需要重新设置
        // super option changed,
        // need to resolve new options.
        Ctor.superOptions = superOptions;
        // check if there are any late-modified/attached options (#4976)
        // 找到更改选项
        var modifiedOptions = resolveModifiedOptions(Ctor);
        // update base extend options
        if (modifiedOptions) {
          // 如果存在被修改或增加的选项，则合并两个选项
          extend(Ctor.extendOptions, modifiedOptions);
        }
        // 选项合并，将新的选项赋值给 options
        options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions);
        if (options.name) {
          options.components[options.name] = Ctor;
        }
      }
    }
    return options
  }

  // 解析构造函数选项中后续被修改或增加的选项
  function resolveModifiedOptions (Ctor) {
    var modified;
    // 构造函数选项
    var latest = Ctor.options;
    // 密封的构造函数选项，备份
    var sealed = Ctor.sealedOptions;
    // 对比两个选项，记录不一致的选项
    for (var key in latest) {
      if (latest[key] !== sealed[key]) {
        if (!modified) { modified = {}; }
        modified[key] = latest[key];
      }
    }
    return modified
  }

  // Vue构造函数
  function Vue (options) {
    // 开发环境下 提示代码
    if (
      !(this instanceof Vue)
    ) {
      warn('Vue is a constructor and should be called with the `new` keyword');
    }
    // Vue.prototype._init 方法 
    this._init(options);
  }

  // 定义 Vue.prototype._init()
  initMixin(Vue);
  /**
   * 定义： 
   *   Vue.prototype.$data
   *   Vue.prototype.$props
   *   Vue.prototype.$set
   *   Vue.prototype.$delete
   *   Vue.prototype.$watch
  */
  stateMixin(Vue);
  /**
   * 定义 事件相关的方法：
   *   Vue.prototype.$on
   *   Vue.prototype.$once
   *   Vue.prototype.$off
   *   Vue.prototype.$emit
  */
  eventsMixin(Vue);
  /**
   * 定义：
   *   Vue.prototype._update
   *   Vue.prototype.$forceUpdate
   *   Vue.prototype.$destroy
  */
  lifecycleMixin(Vue);
  /**
   * 执行 installRenderHelpers，在 Vue.prototype 对象上安装运行时便利程序
   * 
   * 定义：
   *    Vue.prototype.$nextTick
   *    Vue.prototype.$destroy
   *   
  */
  renderMixin(Vue);

  /*  */

  /**
   * 定义 Vue.use 负责为 Vue 安装插件：
   *   1：判断插件是否已经安装，判重
   *   2：安装插件，执行插件的 install 方法
  */
  function initUse (Vue) {
    // Vue.use(plugin)
    // 本质： 执行插件暴露出来的 install 方法，开始的时候判重，防止重复注册
    Vue.use = function (plugin) {
      // 已经安装过的创建列表
      var installedPlugins = (this._installedPlugins || (this._installedPlugins = []));
      // 确保不会重复注册同一组件
      if (installedPlugins.indexOf(plugin) > -1) {
        return this
      }

      // additional parameters
      // install(Vue)
      // 将 Vue 构造函数放到第一个参数位置，将参数传递给 install 方法
      var args = toArray(arguments, 1);
      args.unshift(this);
      if (typeof plugin.install === 'function') {
        // plugin 是对象，执行 install 方法安装插件
        plugin.install.apply(plugin, args);
      } else if (typeof plugin === 'function') {
        // plugin 是函数，直接执行
        plugin.apply(null, args);
      }
      // plugin 放入已安装的插件数组中，防止重复安装
      installedPlugins.push(plugin);
      return this
    };
  }

  /*  */

  /**
   * 定义 Vue.mixin，负责全局混入选项，影响之后所有创建的 Vue 实例，这些实例会混入并全局合并
  */
  function initMixin$1 (Vue) {
    // 利用 mergeOptions 合并两个选项
    Vue.mixin = function (mixin) {
      this.options = mergeOptions(this.options, mixin);
      return this
    };
  }

  /*  */

  // 定义 Vue.extend 方法
  function initExtend (Vue) {
    /**
     * Each instance constructor, including Vue, has a unique
     * cid. This enables us to create wrapped "child
     * constructors" for prototypal inheritance and cache them.
     */
    Vue.cid = 0;
    var cid = 1;

    /**
     * Class inheritance
     * 基于 Vue 去扩展子类，该子类同样支持进一步的扩展
     * 扩展时可以传递一些默认配置
     * 默认配置如果和基类有冲突会进行选项合并
     */
    Vue.extend = function (extendOptions) {
      // 用户传入的一个包含组件选项的对象参数
      extendOptions = extendOptions || {};
      // 指向父类，即基础 Vue 类
      var Super = this;
      // 父类的 cid 属性
      var SuperId = Super.cid;
      // 利用缓存，如果存在则返回缓存中的构造函数
      // 用同一个配置项，多次调用 Vue.extend 方法时，第二次调用开始就会使用缓存
      var cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {});
      if (cachedCtors[SuperId]) {
        return cachedCtors[SuperId]
      }

      // 验证组件名称
      var name = extendOptions.name || Super.options.name;
      if ( name) {
        validateComponentName(name);
      }

      // 定义一个 Vue 子类，和 Vue 构造函数一样
      // function Vue(options){
      //   this._init(options)
      // }
      var Sub = function VueComponent (options) {
        // 初始化
        this._init(options);
      };
      // 设置子类的原型对象，通过原型链继承的方式继承 Vue
      Sub.prototype = Object.create(Super.prototype);
      // 设置构造函数
      Sub.prototype.constructor = Sub;
      Sub.cid = cid++;
      // 合并基类选项和传递进来的选项
      // 可以通过 Vue.extend 方法定义一个子类，预设一些配置项，这些配置项相当于直接使用 Vue 构造函数时的 默认配置一样
      Sub.options = mergeOptions(
        Super.options,
        extendOptions
      );
      // 记录自己的基类，即将父类保存到子类的 super 属性中，以确保在子类中能拿到父类
      Sub['super'] = Super;

      // For props and computed properties, we define the proxy getters on
      // the Vue instances at extension time, on the extended prototype. This
      // avoids Object.defineProperty calls for each instance created.
      // 将 props、computed 代理到子类上，在子类支持通过 this.xx 的方式访问
      if (Sub.options.props) {
        initProps$1(Sub);
      }
      if (Sub.options.computed) {
        initComputed$1(Sub);
      }

      // allow further extension/mixin/plugin usage
      // 定义 extend、mixin、use 三个静态方法，让子类支持继续向下扩展
      Sub.extend = Super.extend;
      Sub.mixin = Super.mixin;
      Sub.use = Super.use;

      // create asset registers, so extended classes
      // can have their private assets too.
      // 定义 component directive filter 三个静态方法
      ASSET_TYPES.forEach(function (type) {
        Sub[type] = Super[type];
      });
      // enable recursive self-lookup
      // 组件递归自调用 的实现原理
      // 如果组件设置了 name 属性，则将自己注册到自己的 components 选项中
      if (name) {
        // {
        //   name: 'Comp',
        //   components: { 'Comp': 'Comp' }
        // }
        Sub.options.components[name] = Sub;
      }

      // keep a reference to the super options at extension time.
      // later at instantiation we can check if Super's options have
      // been updated.
      // 在扩展时保留对基类选项的引用
      Sub.superOptions = Super.options;
      Sub.extendOptions = extendOptions;
      Sub.sealedOptions = extend({}, Sub.options);

      // cache constructor
      // 缓存
      cachedCtors[SuperId] = Sub;
      return Sub
    };
  }

  function initProps$1 (Comp) {
    var props = Comp.options.props;
    for (var key in props) {
      proxy(Comp.prototype, "_props", key);
    }
  }

  function initComputed$1 (Comp) {
    var computed = Comp.options.computed;
    for (var key in computed) {
      defineComputed(Comp.prototype, key, computed[key]);
    }
  }

  /*  */

  function initAssetRegisters (Vue) {
    /**
     * Create asset registration methods.
     * 初始化 Vue.component、Vue.directive、Vue.filter
     */
    ASSET_TYPES.forEach(function (type) {
      // 以 component 为例
      // 定义 Vue.component = function () { xx }
      Vue[type] = function (
        id,
        definition
      ) {
        if (!definition) {
          return this.options[type + 's'][id]
        } else {
          /* istanbul ignore if */
          if ( type === 'component') {
            // 检验 name 值是否合法
            validateComponentName(id);
          }
          if (type === 'component' && isPlainObject(definition)) {
            // 设置组件名称，有 name 则使用 name，否则就是 id
            definition.name = definition.name || id;
            // Vue.extend 方法、基于 definition 去扩展一个新的组件子类，直接 new Definition() 实例化一个组件
            definition = this.options._base.extend(definition);
          }
          if (type === 'directive' && typeof definition === 'function') {
            // 如果是函数，默认监听 bind 和 update 两个事件
            definition = { bind: definition, update: definition };
          }
          // this.options[components] = { CompName: definition }
          // 在实例化时通过 mergeOptions 将全局注册的组件合并到每个组件的配置对象的 components 中
          this.options[type + 's'][id] = definition;
          return definition
        }
      };
    });
  }

  /*  */





  function getComponentName (opts) {
    return opts && (opts.Ctor.options.name || opts.tag)
  }

  function matches (pattern, name) {
    if (Array.isArray(pattern)) {
      return pattern.indexOf(name) > -1
    } else if (typeof pattern === 'string') {
      return pattern.split(',').indexOf(name) > -1
    } else if (isRegExp(pattern)) {
      return pattern.test(name)
    }
    /* istanbul ignore next */
    return false
  }

  function pruneCache (keepAliveInstance, filter) {
    var cache = keepAliveInstance.cache;
    var keys = keepAliveInstance.keys;
    var _vnode = keepAliveInstance._vnode;
    for (var key in cache) {
      var entry = cache[key];
      if (entry) {
        var name = entry.name;
        if (name && !filter(name)) {
          pruneCacheEntry(cache, key, keys, _vnode);
        }
      }
    }
  }

  function pruneCacheEntry (
    cache,
    key,
    keys,
    current
  ) {
    var entry = cache[key];
    // 判断当前没有处于被渲染状态的组件，将其销毁
    if (entry && (!current || entry.tag !== current.tag)) {
      entry.componentInstance.$destroy();
    }
    cache[key] = null;
    remove(keys, key);
  }

  var patternTypes = [String, RegExp, Array];

  // 函数式组件
  var KeepAlive = {
    name: 'keep-alive',
    abstract: true,

    props: {
      // 匹配到的组件会被缓存
      include: patternTypes,
      // 匹配到的组件不会被缓存
      exclude: patternTypes,
      // 缓存组件的数量
      max: [String, Number]
    },

    methods: {
      cacheVNode: function cacheVNode() {
        var ref = this;
        var cache = ref.cache;
        var keys = ref.keys;
        var vnodeToCache = ref.vnodeToCache;
        var keyToCache = ref.keyToCache;
        if (vnodeToCache) {
          var tag = vnodeToCache.tag;
          var componentInstance = vnodeToCache.componentInstance;
          var componentOptions = vnodeToCache.componentOptions;
          cache[keyToCache] = {
            name: getComponentName(componentOptions),
            tag: tag,
            componentInstance: componentInstance,
          };
          keys.push(keyToCache);
          // prune oldest entry
          // 如果设置 max 并且缓存的长度超过啦，则从缓存中删除第一个
          if (this.max && keys.length > parseInt(this.max)) {
            pruneCacheEntry(cache, keys[0], keys, this._vnode);
          }
          this.vnodeToCache = null;
        }
      }
    },

    created: function created () {
      // 存储需要缓存的组件
      this.cache = Object.create(null);
      // 存储需要缓存组件的 key
      this.keys = [];
    },

    destroyed: function destroyed () {
      for (var key in this.cache) {
        pruneCacheEntry(this.cache, key, this.keys);
      }
    },

    mounted: function mounted () {
      var this$1 = this;

      this.cacheVNode();
      this.$watch('include', function (val) {
        pruneCache(this$1, function (name) { return matches(val, name); });
      });
      this.$watch('exclude', function (val) {
        pruneCache(this$1, function (name) { return !matches(val, name); });
      });
    },

    updated: function updated () {
      this.cacheVNode();
    },

    render: function render () {
      // 获取默认插槽中的第一个组件节点
      var slot = this.$slots.default;
      var vnode = getFirstComponentChild(slot);
      // 获取该组件节点的 componentOptions
      var componentOptions = vnode && vnode.componentOptions;
      if (componentOptions) {
        // check pattern
        // 获取该组件节点的名称，优先获取组件的 name 字段，如果不存在则获取组件的 tag
        var name = getComponentName(componentOptions);
        var ref = this;
        var include = ref.include;
        var exclude = ref.exclude;
        // 如果 name 不在 include 中 或 存在于 exclude 中则表示不缓存，直接返回 vnode
        if (
          // not included
          (include && (!name || !matches(include, name))) ||
          // excluded
          (exclude && name && matches(exclude, name))
        ) {
          return vnode
        }

        var ref$1 = this;
        var cache = ref$1.cache;
        var keys = ref$1.keys;
        var key = vnode.key == null
          // same constructor may get registered as different local components
          // so cid alone is not enough (#3269)
          ? componentOptions.Ctor.cid + (componentOptions.tag ? ("::" + (componentOptions.tag)) : '')
          : vnode.key;
          // 如果有缓存，则直接从缓存中拿 vnode 实例
        if (cache[key]) {
          vnode.componentInstance = cache[key].componentInstance;
          // make current key freshest
          // 调整该组件 key 的顺序，将其从原来的地方删除并重新放到最后一个
          remove(keys, key);
          keys.push(key);
        } else {
          // 如果没缓存，则将其设置进缓存
          // delay setting the cache until update
          this.vnodeToCache = vnode;
          this.keyToCache = key;
        }

        // 设置 keepAlive 标记
        vnode.data.keepAlive = true;
      }
      return vnode || (slot && slot[0])
    }
  };

  var builtInComponents = {
    KeepAlive: KeepAlive
  };

  /*  */

  /**
   * 初始化全局 api 入口
   *   默认配置： Vue.config
   *   工具方法： Vue.util.xx
   *   Vue.set、Vue.delete、Vue.nextTick、Vue.observable
   *   Vue.options.components、Vue.options.directives、Vue.options.filters、Vue.options._base
   *   Vue.use、Vue.extend、Vue.mixin、Vue.component、Vue.directive、Vue.filter
  */
  function initGlobalAPI (Vue) {
    // config
    var configDef = {};
    // Vue 全局默认的配置
    configDef.get = function () { return config; };
    // 避免 Vue.configDef = {}
    // Vue.configDef.xxx = xxx
    {
      configDef.set = function () {
        warn(
          'Do not replace the Vue.config object, set individual fields instead.'
        );
      };
    }
    // 将配置代理到 Vue 对象上， 通过 Vue.config 的方式访问
    Object.defineProperty(Vue, 'config', configDef);

    // exposed util methods.
    // NOTE: these are not considered part of the public API - avoid relying on
    // them unless you are aware of the risk.
    // 向外暴露一些内置的工具方法
    // 不要轻易使用这些工具方法，除非你很清楚这些工具方法，以及知道使用的风险
    Vue.util = {
      // 警告日志
      warn: warn,
      // 类似选项合并，将 A 对象的属性复制到 B 对象上 shared/util
      extend: extend,
      // 合并选项
      mergeOptions: mergeOptions,
      // 设置响应式，给对象设置 getter、setter，涉及到依赖收集，更新触发依赖通知
      defineReactive: defineReactive
    };

    // Vue.set、Vue.delete、Vue.nextTick
    Vue.set = set;
    Vue.delete = del;
    Vue.nextTick = nextTick;

    // 2.6 explicit observable API
    // 向外暴露为对象设置响应式的方法
    Vue.observable = function (obj) {
      // 为对象设置响应式
      observe(obj);
      return obj
    };
    
    // Vue 全局配置选项
    // Vue.option = { components: {}, directives: {}, filters: {} }
    Vue.options = Object.create(null);
    ASSET_TYPES.forEach(function (type) {
      Vue.options[type + 's'] = Object.create(null);
    });

    // this is used to identify the "base" constructor to extend all plain-object
    // components with in Weex's multi-instance scenarios.
    // 将 Vue 构造函数赋值给 Vue.options._base
    Vue.options._base = Vue;

    // 将 keep-alive 组件放到 Vue.options.component 对象中
    extend(Vue.options.components, builtInComponents);

    // 初始化 Vue.use
    initUse(Vue);
    // Vue.mixins
    initMixin$1(Vue);
    // Vue.extend
    initExtend(Vue);
    // Vue.Component、directive、filter
    initAssetRegisters(Vue);
  }

  initGlobalAPI(Vue);

  Object.defineProperty(Vue.prototype, '$isServer', {
    get: isServerRendering
  });

  Object.defineProperty(Vue.prototype, '$ssrContext', {
    get: function get () {
      /* istanbul ignore next */
      return this.$vnode && this.$vnode.ssrContext
    }
  });

  // expose FunctionalRenderContext for ssr runtime helper installation
  Object.defineProperty(Vue, 'FunctionalRenderContext', {
    value: FunctionalRenderContext
  });

  Vue.version = '2.6.12';

  /*  */

  // these are reserved for web because they are directly compiled away
  // during template compilation
  var isReservedAttr = makeMap('style,class');

  // attributes that should be using props for binding
  var acceptValue = makeMap('input,textarea,option,select,progress');
  var mustUseProp = function (tag, type, attr) {
    return (
      (attr === 'value' && acceptValue(tag)) && type !== 'button' ||
      (attr === 'selected' && tag === 'option') ||
      (attr === 'checked' && tag === 'input') ||
      (attr === 'muted' && tag === 'video')
    )
  };

  var isEnumeratedAttr = makeMap('contenteditable,draggable,spellcheck');

  var isValidContentEditableValue = makeMap('events,caret,typing,plaintext-only');

  var convertEnumeratedValue = function (key, value) {
    return isFalsyAttrValue(value) || value === 'false'
      ? 'false'
      // allow arbitrary string value for contenteditable
      : key === 'contenteditable' && isValidContentEditableValue(value)
        ? value
        : 'true'
  };

  var isBooleanAttr = makeMap(
    'allowfullscreen,async,autofocus,autoplay,checked,compact,controls,declare,' +
    'default,defaultchecked,defaultmuted,defaultselected,defer,disabled,' +
    'enabled,formnovalidate,hidden,indeterminate,inert,ismap,itemscope,loop,multiple,' +
    'muted,nohref,noresize,noshade,novalidate,nowrap,open,pauseonexit,readonly,' +
    'required,reversed,scoped,seamless,selected,sortable,' +
    'truespeed,typemustmatch,visible'
  );

  var xlinkNS = 'http://www.w3.org/1999/xlink';

  var isXlink = function (name) {
    return name.charAt(5) === ':' && name.slice(0, 5) === 'xlink'
  };

  var getXlinkProp = function (name) {
    return isXlink(name) ? name.slice(6, name.length) : ''
  };

  var isFalsyAttrValue = function (val) {
    return val == null || val === false
  };

  /*  */

  function genClassForVnode (vnode) {
    var data = vnode.data;
    var parentNode = vnode;
    var childNode = vnode;
    while (isDef(childNode.componentInstance)) {
      childNode = childNode.componentInstance._vnode;
      if (childNode && childNode.data) {
        data = mergeClassData(childNode.data, data);
      }
    }
    while (isDef(parentNode = parentNode.parent)) {
      if (parentNode && parentNode.data) {
        data = mergeClassData(data, parentNode.data);
      }
    }
    return renderClass(data.staticClass, data.class)
  }

  function mergeClassData (child, parent) {
    return {
      staticClass: concat(child.staticClass, parent.staticClass),
      class: isDef(child.class)
        ? [child.class, parent.class]
        : parent.class
    }
  }

  function renderClass (
    staticClass,
    dynamicClass
  ) {
    if (isDef(staticClass) || isDef(dynamicClass)) {
      return concat(staticClass, stringifyClass(dynamicClass))
    }
    /* istanbul ignore next */
    return ''
  }

  function concat (a, b) {
    return a ? b ? (a + ' ' + b) : a : (b || '')
  }

  function stringifyClass (value) {
    if (Array.isArray(value)) {
      return stringifyArray(value)
    }
    if (isObject(value)) {
      return stringifyObject(value)
    }
    if (typeof value === 'string') {
      return value
    }
    /* istanbul ignore next */
    return ''
  }

  function stringifyArray (value) {
    var res = '';
    var stringified;
    for (var i = 0, l = value.length; i < l; i++) {
      if (isDef(stringified = stringifyClass(value[i])) && stringified !== '') {
        if (res) { res += ' '; }
        res += stringified;
      }
    }
    return res
  }

  function stringifyObject (value) {
    var res = '';
    for (var key in value) {
      if (value[key]) {
        if (res) { res += ' '; }
        res += key;
      }
    }
    return res
  }

  /*  */

  var namespaceMap = {
    svg: 'http://www.w3.org/2000/svg',
    math: 'http://www.w3.org/1998/Math/MathML'
  };

  var isHTMLTag = makeMap(
    'html,body,base,head,link,meta,style,title,' +
    'address,article,aside,footer,header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,' +
    'div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul,' +
    'a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,' +
    's,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,' +
    'embed,object,param,source,canvas,script,noscript,del,ins,' +
    'caption,col,colgroup,table,thead,tbody,td,th,tr,' +
    'button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,' +
    'output,progress,select,textarea,' +
    'details,dialog,menu,menuitem,summary,' +
    'content,element,shadow,template,blockquote,iframe,tfoot'
  );

  // this map is intentionally selective, only covering SVG elements that may
  // contain child elements.
  var isSVG = makeMap(
    'svg,animate,circle,clippath,cursor,defs,desc,ellipse,filter,font-face,' +
    'foreignobject,g,glyph,image,line,marker,mask,missing-glyph,path,pattern,' +
    'polygon,polyline,rect,switch,symbol,text,textpath,tspan,use,view',
    true
  );

  var isPreTag = function (tag) { return tag === 'pre'; };

  var isReservedTag = function (tag) {
    return isHTMLTag(tag) || isSVG(tag)
  };

  function getTagNamespace (tag) {
    if (isSVG(tag)) {
      return 'svg'
    }
    // basic support for MathML
    // note it doesn't support other MathML elements being component roots
    if (tag === 'math') {
      return 'math'
    }
  }

  var unknownElementCache = Object.create(null);
  function isUnknownElement (tag) {
    /* istanbul ignore if */
    if (!inBrowser) {
      return true
    }
    if (isReservedTag(tag)) {
      return false
    }
    tag = tag.toLowerCase();
    /* istanbul ignore if */
    if (unknownElementCache[tag] != null) {
      return unknownElementCache[tag]
    }
    var el = document.createElement(tag);
    if (tag.indexOf('-') > -1) {
      // http://stackoverflow.com/a/28210364/1070244
      return (unknownElementCache[tag] = (
        el.constructor === window.HTMLUnknownElement ||
        el.constructor === window.HTMLElement
      ))
    } else {
      return (unknownElementCache[tag] = /HTMLUnknownElement/.test(el.toString()))
    }
  }

  var isTextInputType = makeMap('text,number,password,search,email,tel,url');

  /*  */

  /**
   * Query an element selector if it's not an element already.
   */
  function query (el) {
    if (typeof el === 'string') {
      var selected = document.querySelector(el);
      if (!selected) {
         warn(
          'Cannot find element: ' + el
        );
        return document.createElement('div')
      }
      return selected
    } else {
      return el
    }
  }

  /*  */

  // 创建元素节点
  function createElement$1 (tagName, vnode) {
    var elm = document.createElement(tagName);
    if (tagName !== 'select') {
      return elm
    }
    // false or null will remove the attribute but undefined will not
    // 如果是 select 元素,则为它设置 multiple 属性
    if (vnode.data && vnode.data.attrs && vnode.data.attrs.multiple !== undefined) {
      elm.setAttribute('multiple', 'multiple');
    }
    return elm
  }

  // 创建带命名空间的元素节点
  function createElementNS (namespace, tagName) {
    return document.createElementNS(namespaceMap[namespace], tagName)
  }

  // 创建文本节点
  function createTextNode (text) {
    return document.createTextNode(text)
  }

  // 创建注释节点
  function createComment (text) {
    return document.createComment(text)
  }

  // 在指定节点前传入节点
  function insertBefore (parentNode, newNode, referenceNode) {
    parentNode.insertBefore(newNode, referenceNode);
  }

  // 移除指定子节点
  function removeChild (node, child) {
    node.removeChild(child);
  }

  // 添加子节点
  function appendChild (node, child) {
    node.appendChild(child);
  }

  // 都会指定节点的父节点
  function parentNode (node) {
    return node.parentNode
  }

  // 返回指定节点的下一个兄弟节点
  function nextSibling (node) {
    return node.nextSibling
  }

  // 返回指定节点的标签名
  function tagName (node) {
    return node.tagName
  }

  // 为指定节点设置文本
  function setTextContent (node, text) {
    node.textContent = text;
  }

  // 为节点设置指定的 scopeId 属性，值为 ''
  function setStyleScope (node, scopeId) {
    node.setAttribute(scopeId, '');
  }

  var nodeOps = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createElement: createElement$1,
    createElementNS: createElementNS,
    createTextNode: createTextNode,
    createComment: createComment,
    insertBefore: insertBefore,
    removeChild: removeChild,
    appendChild: appendChild,
    parentNode: parentNode,
    nextSibling: nextSibling,
    tagName: tagName,
    setTextContent: setTextContent,
    setStyleScope: setStyleScope
  });

  /*  */

  var ref = {
    create: function create (_, vnode) {
      registerRef(vnode);
    },
    update: function update (oldVnode, vnode) {
      if (oldVnode.data.ref !== vnode.data.ref) {
        registerRef(oldVnode, true);
        registerRef(vnode);
      }
    },
    destroy: function destroy (vnode) {
      registerRef(vnode, true);
    }
  };

  function registerRef (vnode, isRemoval) {
    var key = vnode.data.ref;
    if (!isDef(key)) { return }

    var vm = vnode.context;
    var ref = vnode.componentInstance || vnode.elm;
    var refs = vm.$refs;
    if (isRemoval) {
      if (Array.isArray(refs[key])) {
        remove(refs[key], ref);
      } else if (refs[key] === ref) {
        refs[key] = undefined;
      }
    } else {
      if (vnode.data.refInFor) {
        if (!Array.isArray(refs[key])) {
          refs[key] = [ref];
        } else if (refs[key].indexOf(ref) < 0) {
          // $flow-disable-line
          refs[key].push(ref);
        }
      } else {
        refs[key] = ref;
      }
    }
  }

  /**
   * Virtual DOM patching algorithm based on Snabbdom by
   * Simon Friis Vindum (@paldepind)
   * Licensed under the MIT License
   * https://github.com/paldepind/snabbdom/blob/master/LICENSE
   *
   * modified by Evan You (@yyx990803)
   *
   * Not type-checking this because this file is perf-critical and the cost
   * of making flow understand it is not worth it.
   */

  var emptyNode = new VNode('', {}, []);

  var hooks = ['create', 'activate', 'update', 'remove', 'destroy'];

  // 判断两个节点是否相同
  function sameVnode (a, b) {
    return (
      // 两个节点的 key 是否相同
      a.key === b.key &&
      // 异步占位符
      a.asyncFactory === b.asyncFactory && (
        (
          a.tag === b.tag &&
          a.isComment === b.isComment &&
          // 都有 data 属性
          isDef(a.data) === isDef(b.data) &&
          // input 标签的情况
          sameInputType(a, b)
        ) || (
          isTrue(a.isAsyncPlaceholder) &&
          isUndef(b.asyncFactory.error)
        )
      )
    )
  }

  function sameInputType (a, b) {
    if (a.tag !== 'input') { return true }
    var i;
    var typeA = isDef(i = a.data) && isDef(i = i.attrs) && i.type;
    var typeB = isDef(i = b.data) && isDef(i = i.attrs) && i.type;
    return typeA === typeB || isTextInputType(typeA) && isTextInputType(typeB)
  }

  // 得到指定范围内节点的 key 和索引之间的关系映射
  function createKeyToOldIdx (children, beginIdx, endIdx) {
    var i, key;
    var map = {};
    for (i = beginIdx; i <= endIdx; ++i) {
      // 节点的 key
      key = children[i].key;
      // 以节点的 key 为键，节点的下标为 value，生成 map 对象
      if (isDef(key)) { map[key] = i; }
    }
    return map
  }

  function createPatchFunction (backend) {
    var i, j;
    var cbs = {};

    // modules: { ref,directives,平台持有的一些操作... }
    // nodeOps: { 对元素的增删改查 API }
    var modules = backend.modules;
    var nodeOps = backend.nodeOps;

    // 遍历 hooks 钩子，从 modules 的各个模块中找到对应的方法，将这些放到 cb[hook] = [hook 方法] 中，在合适的时间调用对应的钩子
    for (i = 0; i < hooks.length; ++i) {
      cbs[hooks[i]] = [];
      for (j = 0; j < modules.length; ++j) {
        if (isDef(modules[j][hooks[i]])) {
          cbs[hooks[i]].push(modules[j][hooks[i]]);
        }
      }
    }

    // 为元素创建一个空的 Vnode
    function emptyNodeAt (elm) {
      return new VNode(nodeOps.tagName(elm).toLowerCase(), {}, [], undefined, elm)
    }

    function createRmCb (childElm, listeners) {
      function remove () {
        if (--remove.listeners === 0) {
          removeNode(childElm);
        }
      }
      remove.listeners = listeners;
      return remove
    }

    // 删除节点
    function removeNode (el) {
      // 获取父节点
      var parent = nodeOps.parentNode(el);
      // element may have already been removed due to v-html / v-text
      if (isDef(parent)) {
        // 调用父节点的 removeChild 方法
        nodeOps.removeChild(parent, el);
      }
    }

    function isUnknownElement (vnode, inVPre) {
      return (
        !inVPre &&
        !vnode.ns &&
        !(
          config.ignoredElements.length &&
          config.ignoredElements.some(function (ignore) {
            return isRegExp(ignore)
              ? ignore.test(vnode.tag)
              : ignore === vnode.tag
          })
        ) &&
        config.isUnknownElement(vnode.tag)
      )
    }

    var creatingElmInVPre = 0;

    // 基于 vnode 创建整颗 DOM 树，并插入父节点上
    function createElm (
      vnode,
      insertedVnodeQueue,
      parentElm,
      refElm,
      nested,
      ownerArray,
      index
    ) {
      if (isDef(vnode.elm) && isDef(ownerArray)) {
        // This vnode was used in a previous render!
        // now it's used as a new node, overwriting its elm would cause
        // potential patch errors down the road when it's used as an insertion
        // reference node. Instead, we clone the node on-demand before creating
        // associated DOM element for it.
        vnode = ownerArray[index] = cloneVNode(vnode);
      }

      vnode.isRootInsert = !nested; // for transition enter check
      /**
       * 重点：
       * 如果是普通元素，什么都不做
       * 如果是创建组件，则执行 data.hook.init 方法，实例化组件，然后挂载
       * 为组件执行各个模块的 create 钩子函数
       * 如果组件被 keep-alive 包裹，则激活组件
      */
      if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
        return
      }

      // 获取 data 对象
      var data = vnode.data;
      // 获取节点的所有子节点
      var children = vnode.children;
      // 节点标签
      var tag = vnode.tag;
      // 判断是否有 tag 标签
      if (isDef(tag)) {
        {
          if (data && data.pre) {
            creatingElmInVPre++;
          }
          // 未知标签
          if (isUnknownElement(vnode, creatingElmInVPre)) {
            warn(
              'Unknown custom element: <' + tag + '> - did you ' +
              'register the component correctly? For recursive components, ' +
              'make sure to provide the "name" option.',
              vnode.context
            );
          }
        }

        // 创建元素节点
        vnode.elm = vnode.ns
          ? nodeOps.createElementNS(vnode.ns, tag)
          : nodeOps.createElement(tag, vnode);
        setScope(vnode);

        /* istanbul ignore if */
        {
          // 递归创建元素节点的子节点，生成 DOM 树
          createChildren(vnode, children, insertedVnodeQueue);
          if (isDef(data)) {
            invokeCreateHooks(vnode, insertedVnodeQueue);
          }
          // 插入到 DOM 中
          insert(parentElm, vnode.elm, refElm);
        }

        if ( data && data.pre) {
          creatingElmInVPre--;
        }
      } else if (isTrue(vnode.isComment)) {
        // 判断是否为 注释节点
        // 创建注释节点
        vnode.elm = nodeOps.createComment(vnode.text);
        // 插入到 DOM 中
        insert(parentElm, vnode.elm, refElm);
      } else {
        // 文本节点
        // 创建文本节点
        vnode.elm = nodeOps.createTextNode(vnode.text);
        // 插入到 DOM 中
        insert(parentElm, vnode.elm, refElm);
      }
    }

    // 如果 vnode 是个组件，则执行 init 钩子，创建组件实例并挂载，然后为组件执行各个模块的 create 方法
    function createComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
      var i = vnode.data;
      if (isDef(i)) {
        // 判断组件实例是否已经存在 && 组件被 keep-alive 包裹
        var isReactivated = isDef(vnode.componentInstance) && i.keepAlive;
        // 执行组件的 data.hook.init 方法，实例化组件，挂载
        // 如果被 keep-alive 包裹，再执行 prepatch 钩子，用 vnode 上的属性更新 oldVnode 上的属性
        if (isDef(i = i.hook) && isDef(i = i.init)) {
          i(vnode, false /* hydrating */);
        }
        // after calling the init hook, if the vnode is a child component
        // it should've created a child instance and mounted it. the child
        // component also has set the placeholder vnode's elm.
        // in that case we can just return the element and be done.
        if (isDef(vnode.componentInstance)) {
          // 为组件执行各个模块的 create 钩子函数
          initComponent(vnode, insertedVnodeQueue);
          // 将组件上的 DOM 节点插入到父节点
          insert(parentElm, vnode.elm, refElm);
          if (isTrue(isReactivated)) {
            // 组件被 keep-alive 包裹,激活组件
            reactivateComponent(vnode, insertedVnodeQueue, parentElm, refElm);
          }
          return true
        }
      }
    }

    function initComponent (vnode, insertedVnodeQueue) {
      if (isDef(vnode.data.pendingInsert)) {
        insertedVnodeQueue.push.apply(insertedVnodeQueue, vnode.data.pendingInsert);
        vnode.data.pendingInsert = null;
      }
      vnode.elm = vnode.componentInstance.$el;
      if (isPatchable(vnode)) {
        // 为组件执行给个模块的 create 钩子函数
        invokeCreateHooks(vnode, insertedVnodeQueue);
        setScope(vnode);
      } else {
        // empty component root.
        // skip all element-related modules except for ref (#3455)
        registerRef(vnode);
        // make sure to invoke the insert hook
        insertedVnodeQueue.push(vnode);
      }
    }

    function reactivateComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
      var i;
      // hack for #4339: a reactivated component with inner transition
      // does not trigger because the inner node's created hooks are not called
      // again. It's not ideal to involve module-specific logic in here but
      // there doesn't seem to be a better way to do it.
      var innerNode = vnode;
      while (innerNode.componentInstance) {
        innerNode = innerNode.componentInstance._vnode;
        if (isDef(i = innerNode.data) && isDef(i = i.transition)) {
          for (i = 0; i < cbs.activate.length; ++i) {
            cbs.activate[i](emptyNode, innerNode);
          }
          insertedVnodeQueue.push(innerNode);
          break
        }
      }
      // unlike a newly created component,
      // a reactivated keep-alive component doesn't insert itself
      insert(parentElm, vnode.elm, refElm);
    }

    // 向父节点插入节点
    function insert (parent, elm, ref) {
      if (isDef(parent)) {
        if (isDef(ref)) {
          if (nodeOps.parentNode(ref) === parent) {
            nodeOps.insertBefore(parent, elm, ref);
          }
        } else {
          nodeOps.appendChild(parent, elm);
        }
      }
    }

    // 创建所有子节点，并插入到父节点
    function createChildren (vnode, children, insertedVnodeQueue) {
      // 数组,一组节点
      if (Array.isArray(children)) {
        {
          // 检查 key 是否重复
          checkDuplicateKeys(children);
        }
        // 循环为每个节点调用 creatElm 方法，创建这些节点
        for (var i = 0; i < children.length; ++i) {
          createElm(children[i], insertedVnodeQueue, vnode.elm, null, true, children, i);
        }
      } else if (isPrimitive(vnode.text)) {
        // Vnode 是文本节点，直接创建文本节点并插入父节点
        nodeOps.appendChild(vnode.elm, nodeOps.createTextNode(String(vnode.text)));
      }
    }

    function isPatchable (vnode) {
      while (vnode.componentInstance) {
        vnode = vnode.componentInstance._vnode;
      }
      return isDef(vnode.tag)
    }

    // 调用各个模块的 create 方法，比如创建属性的、样式的、指令等，然后执行组件的 mounted 生命周期
    function invokeCreateHooks (vnode, insertedVnodeQueue) {
      for (var i$1 = 0; i$1 < cbs.create.length; ++i$1) {
        cbs.create[i$1](emptyNode, vnode);
      }
      // 组件钩子
      i = vnode.data.hook; // Reuse variable
      if (isDef(i)) {
        // 没有 create 钩子
        if (isDef(i.create)) { i.create(emptyNode, vnode); }
        // 调用组件的 insert 钩子,执行组件的 mounted 生命周期
        if (isDef(i.insert)) { insertedVnodeQueue.push(vnode); }
      }
    }

    // set scope id attribute for scoped CSS.
    // this is implemented as a special case to avoid the overhead
    // of going through the normal attribute patching process.
    function setScope (vnode) {
      var i;
      if (isDef(i = vnode.fnScopeId)) {
        nodeOps.setStyleScope(vnode.elm, i);
      } else {
        var ancestor = vnode;
        while (ancestor) {
          if (isDef(i = ancestor.context) && isDef(i = i.$options._scopeId)) {
            nodeOps.setStyleScope(vnode.elm, i);
          }
          ancestor = ancestor.parent;
        }
      }
      // for slot content they should also get the scopeId from the host instance.
      if (isDef(i = activeInstance) &&
        i !== vnode.context &&
        i !== vnode.fnContext &&
        isDef(i = i.$options._scopeId)
      ) {
        nodeOps.setStyleScope(vnode.elm, i);
      }
    }

    // 在指定索引范围内添加节点
    function addVnodes (parentElm, refElm, vnodes, startIdx, endIdx, insertedVnodeQueue) {
      for (; startIdx <= endIdx; ++startIdx) {
        createElm(vnodes[startIdx], insertedVnodeQueue, parentElm, refElm, false, vnodes, startIdx);
      }
    }

    // 销毁节点
    function invokeDestroyHook (vnode) {
      var i, j;
      // 获取 data 对象
      var data = vnode.data;
      if (isDef(data)) {
        // 执行 data.hook.destroy 钩子
        if (isDef(i = data.hook) && isDef(i = i.destroy)) { i(vnode); }
        for (i = 0; i < cbs.destroy.length; ++i) { cbs.destroy[i](vnode); }
      }
      if (isDef(i = vnode.children)) {
        // 递归销毁所有子节点
        for (j = 0; j < vnode.children.length; ++j) {
          invokeDestroyHook(vnode.children[j]);
        }
      }
    }

    // 移除指定索引范围内的节点
    function removeVnodes (vnodes, startIdx, endIdx) {
      for (; startIdx <= endIdx; ++startIdx) {
        var ch = vnodes[startIdx];
        if (isDef(ch)) {
          if (isDef(ch.tag)) {
            removeAndInvokeRemoveHook(ch);
            invokeDestroyHook(ch);
          } else { // Text node
            removeNode(ch.elm);
          }
        }
      }
    }

    function removeAndInvokeRemoveHook (vnode, rm) {
      if (isDef(rm) || isDef(vnode.data)) {
        var i;
        var listeners = cbs.remove.length + 1;
        if (isDef(rm)) {
          // we have a recursively passed down rm callback
          // increase the listeners count
          rm.listeners += listeners;
        } else {
          // directly removing
          rm = createRmCb(vnode.elm, listeners);
        }
        // recursively invoke hooks on child component root node
        if (isDef(i = vnode.componentInstance) && isDef(i = i._vnode) && isDef(i.data)) {
          removeAndInvokeRemoveHook(i, rm);
        }
        for (i = 0; i < cbs.remove.length; ++i) {
          cbs.remove[i](vnode, rm);
        }
        if (isDef(i = vnode.data.hook) && isDef(i = i.remove)) {
          i(vnode, rm);
        } else {
          rm();
        }
      } else {
        removeNode(vnode.elm);
      }
    }

    // 循环更新子节点
    function updateChildren (parentElm, oldCh, newCh, insertedVnodeQueue, removeOnly) {
      // oldChildren 开始索引
      var oldStartIdx = 0;
      // newChildren 开始索引
      var newStartIdx = 0;
      // oldChildren 结束索引
      var oldEndIdx = oldCh.length - 1;
      // oldChildren 中所有未处理节点中的第一个
      var oldStartVnode = oldCh[0];
      // oldChildren 中所有未处理节点中的最后一个
      var oldEndVnode = oldCh[oldEndIdx];
      // newChildren 结束索引
      var newEndIdx = newCh.length - 1;
      // newChildren 中所有未处理节点中的第一个
      var newStartVnode = newCh[0];
      // newChildren 中所有未处理节点中的最后一个
      var newEndVnode = newCh[newEndIdx];
      var oldKeyToIdx, idxInOld, vnodeToMove, refElm;

      // removeOnly is a special flag used only by <transition-group>
      // to ensure removed elements stay in correct relative positions
      // during leaving transitions
      // 是否需要移动节点, true: 需要移动  <transition-group>使用，确保被移除的元素在离开转换期间保持在正确的相对位置
      var canMove = !removeOnly;

      {
        // 检查新节点的 key 是否重复
        checkDuplicateKeys(newCh);
      }

      // 优化策略：避免双重循环数据量导致事件复杂度高带来的性能问题
      // 以 "新前"、"新后"、"旧前"、"旧后" 的方式开始对比节点
      while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
        // 如果 oldStartVnode 或 oldEndVnode 为 undefined 或 null 则下一个 或 上一个
        if (isUndef(oldStartVnode)) {
          oldStartVnode = oldCh[++oldStartIdx]; // Vnode has been moved left
        } else if (isUndef(oldEndVnode)) {
          oldEndVnode = oldCh[--oldEndIdx];
        } else if (sameVnode(oldStartVnode, newStartVnode)) {
          // 如果 新前 和 旧前 节点相同，则把两个节点进行 patch 更新，并修改指针位置
          patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue, newCh, newStartIdx);
          oldStartVnode = oldCh[++oldStartIdx];
          newStartVnode = newCh[++newStartIdx];
        } else if (sameVnode(oldEndVnode, newEndVnode)) {
          // 新后 和 旧后
          patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue, newCh, newEndIdx);
          oldEndVnode = oldCh[--oldEndIdx];
          newEndVnode = newCh[--newEndIdx];
        } else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
          // 新后 和 旧前
          patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue, newCh, newEndIdx);
          // 移动节点
          canMove && nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm));
          oldStartVnode = oldCh[++oldStartIdx];
          newEndVnode = newCh[--newEndIdx];
        } else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
          // 新前 和 旧后
          patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue, newCh, newStartIdx);
          canMove && nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
          oldEndVnode = oldCh[--oldEndIdx];
          newStartVnode = newCh[++newStartIdx];
        } else {
          // 如果不属于以上四种情况,则常规循环比对 patch
          // 生成老节点的 map 对象，一节点的 key 为键，节点的下标为 value { key: idx }
          if (isUndef(oldKeyToIdx)) { oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx); }
          // 从老节点的 map 对象中根据节点的 key 找到新开始节点在老节点数组中对应的下标
          idxInOld = isDef(newStartVnode.key)
            ? oldKeyToIdx[newStartVnode.key]
            : findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx);
            // 如果下标不存在，即 新节点在老节点数组中没有找到，说明是新增节点
          if (isUndef(idxInOld)) { // New element
            // 新增节点并插入到合适的位置
            createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx);
          } else {
            // 存在，找到了相同节点
            vnodeToMove = oldCh[idxInOld];
            // 两个节点相同
            if (sameVnode(vnodeToMove, newStartVnode)) {
              // 调用 patchVnode 更新节点
              patchVnode(vnodeToMove, newStartVnode, insertedVnodeQueue, newCh, newStartIdx);
              oldCh[idxInOld] = undefined;
              canMove && nodeOps.insertBefore(parentElm, vnodeToMove.elm, oldStartVnode.elm);
            } else {
              // same key but different element. treat as new element
              // 少见：新老节点 key 相同，但不是同一个节点，则认为新节点是新增
              createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx);
            }
          }
          newStartVnode = newCh[++newStartIdx];
        }
      }
      // 新节点或老节点被遍历完
      if (oldStartIdx > oldEndIdx) {
        // 如果 oldChildren 比 newChildren 先循环完毕，那么newChildren 里剩余节点都是需要新增的，把剩余节点都插入到 DOM 中
        refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm;
        addVnodes(parentElm, refElm, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
      } else if (newStartIdx > newEndIdx) {
        // 如果 newChildren 先循环完毕，则 oldChildren 剩余节点全部删除
        removeVnodes(oldCh, oldStartIdx, oldEndIdx);
      }
    }

    // 检查一组元素的 key 是否重复
    function checkDuplicateKeys (children) {
      var seenKeys = {};
      for (var i = 0; i < children.length; i++) {
        var vnode = children[i];
        var key = vnode.key;
        if (isDef(key)) {
          if (seenKeys[key]) {
            warn(
              ("Duplicate keys detected: '" + key + "'. This may cause an update error."),
              vnode.context
            );
          } else {
            seenKeys[key] = true;
          }
        }
      }
    }

    // 找到新节点在老节点中的位置索引
    function findIdxInOld (node, oldCh, start, end) {
      for (var i = start; i < end; i++) {
        var c = oldCh[i];
        if (isDef(c) && sameVnode(node, c)) { return i }
      }
    }

    /**
     * 更新节点
     * 1：全量的属性更新
     * 2：如果新老节点都有子节点，则递归执行 diff
     * 3：如果新节点有子节点，老节点没有，则新增新节点的子节点
     * 4：如果老节点有子节点，新节点没有，则删除老节点的子节点
     * 5：更新文本节点
    */
    function patchVnode (
      oldVnode,
      vnode,
      insertedVnodeQueue,
      ownerArray,
      index,
      removeOnly
    ) {
      // 新老节点完全一样
      if (oldVnode === vnode) {
        return
      }

      if (isDef(vnode.elm) && isDef(ownerArray)) {
        // clone reused vnode
        vnode = ownerArray[index] = cloneVNode(vnode);
      }

      var elm = vnode.elm = oldVnode.elm;

      // 异步占位符节点
      if (isTrue(oldVnode.isAsyncPlaceholder)) {
        if (isDef(vnode.asyncFactory.resolved)) {
          hydrate(oldVnode.elm, vnode, insertedVnodeQueue);
        } else {
          vnode.isAsyncPlaceholder = true;
        }
        return
      } 

      // reuse element for static trees.
      // note we only do this if the vnode is cloned -
      // if the new node is not cloned it means the render functions have been
      // reset by the hot-reload-api and we need to do a proper re-render.
      // vnode 和 oldVnode 都是静态节点，则跳过更新
      if (isTrue(vnode.isStatic) &&
        isTrue(oldVnode.isStatic) &&
        vnode.key === oldVnode.key &&
        (isTrue(vnode.isCloned) || isTrue(vnode.isOnce))
      ) {
        // 新旧节点都是静态的而且两个节点的 key 一样，并且新节点被 clone 了 或者 新节点有 v-once指令，则重用这部分节点
        vnode.componentInstance = oldVnode.componentInstance;
        return
      }

      // 执行组件的 prepatch 钩子
      var i;
      var data = vnode.data;
      if (isDef(data) && isDef(i = data.hook) && isDef(i = i.prepatch)) {
        i(oldVnode, vnode);
      }

      // 获取新老节点的子节点
      var oldCh = oldVnode.children;
      var ch = vnode.children;
      // 全量更新节点的所有属性； Vue3.0 在此做了大量优化，引入 block 的概念
      if (isDef(data) && isPatchable(vnode)) {
        for (i = 0; i < cbs.update.length; ++i) { cbs.update[i](oldVnode, vnode); }
        if (isDef(i = data.hook) && isDef(i = i.update)) { i(oldVnode, vnode); }
      }
      // vnode 有 text 属性
      if (isUndef(vnode.text)) {
        // vnode 和 oldVnode 子节点是否都存在
        if (isDef(oldCh) && isDef(ch)) {
          // 都存在，判断子节点是否相同，不同则更新子节点
          if (oldCh !== ch) { updateChildren(elm, oldCh, ch, insertedVnodeQueue, removeOnly); }
        } else if (isDef(ch)) {
          // 只有 vnode 的子节点存在，新增节点
          {
            checkDuplicateKeys(ch);
          }
          // 判断 oldVnode 是否有文本;有则把 vnode 的子节点添加到 真实 DOM 中；没有则清空 DOM 的文本，再把 vnode  的子节点添加到真实 DOM 中
          if (isDef(oldVnode.text)) { nodeOps.setTextContent(elm, ''); }
          addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
        } else if (isDef(oldCh)) {
          // 只有 oldVnode 的子节点，新节点没有
          // 清空 DOM 中的子节点
          removeVnodes(oldCh, 0, oldCh.length - 1);
        } else if (isDef(oldVnode.text)) {
          // oldVnode 有文本，新节点不存在
          // 清空 oldNode 文本
          nodeOps.setTextContent(elm, '');
        }
      } else if (oldVnode.text !== vnode.text) {
        // vnode 和 oldVnode 的 text 属性不相同
        // 则使用 vnode 的 text 替换真实 DOM 的文本
        nodeOps.setTextContent(elm, vnode.text);
      }
      if (isDef(data)) {
        if (isDef(i = data.hook) && isDef(i = i.postpatch)) { i(oldVnode, vnode); }
      }
    }

    function invokeInsertHook (vnode, queue, initial) {
      // delay insert hooks for component root nodes, invoke them after the
      // element is really inserted
      if (isTrue(initial) && isDef(vnode.parent)) {
        vnode.parent.data.pendingInsert = queue;
      } else {
        for (var i = 0; i < queue.length; ++i) {
          queue[i].data.hook.insert(queue[i]);
        }
      }
    }

    var hydrationBailed = false;
    // list of modules that can skip create hook during hydration because they
    // are already rendered on the client or has no need for initialization
    // Note: style is excluded because it relies on initial clone for future
    // deep updates (#7063).
    var isRenderedModule = makeMap('attrs,class,staticClass,staticStyle,key');

    // Note: this is a browser-only function so we can assume elms are DOM nodes.
    function hydrate (elm, vnode, insertedVnodeQueue, inVPre) {
      var i;
      var tag = vnode.tag;
      var data = vnode.data;
      var children = vnode.children;
      inVPre = inVPre || (data && data.pre);
      vnode.elm = elm;

      if (isTrue(vnode.isComment) && isDef(vnode.asyncFactory)) {
        vnode.isAsyncPlaceholder = true;
        return true
      }
      // assert node match
      {
        if (!assertNodeMatch(elm, vnode, inVPre)) {
          return false
        }
      }
      if (isDef(data)) {
        if (isDef(i = data.hook) && isDef(i = i.init)) { i(vnode, true /* hydrating */); }
        if (isDef(i = vnode.componentInstance)) {
          // child component. it should have hydrated its own tree.
          initComponent(vnode, insertedVnodeQueue);
          return true
        }
      }
      if (isDef(tag)) {
        if (isDef(children)) {
          // empty element, allow client to pick up and populate children
          if (!elm.hasChildNodes()) {
            createChildren(vnode, children, insertedVnodeQueue);
          } else {
            // v-html and domProps: innerHTML
            if (isDef(i = data) && isDef(i = i.domProps) && isDef(i = i.innerHTML)) {
              if (i !== elm.innerHTML) {
                /* istanbul ignore if */
                if (
                  typeof console !== 'undefined' &&
                  !hydrationBailed
                ) {
                  hydrationBailed = true;
                  console.warn('Parent: ', elm);
                  console.warn('server innerHTML: ', i);
                  console.warn('client innerHTML: ', elm.innerHTML);
                }
                return false
              }
            } else {
              // iterate and compare children lists
              var childrenMatch = true;
              var childNode = elm.firstChild;
              for (var i$1 = 0; i$1 < children.length; i$1++) {
                if (!childNode || !hydrate(childNode, children[i$1], insertedVnodeQueue, inVPre)) {
                  childrenMatch = false;
                  break
                }
                childNode = childNode.nextSibling;
              }
              // if childNode is not null, it means the actual childNodes list is
              // longer than the virtual children list.
              if (!childrenMatch || childNode) {
                /* istanbul ignore if */
                if (
                  typeof console !== 'undefined' &&
                  !hydrationBailed
                ) {
                  hydrationBailed = true;
                  console.warn('Parent: ', elm);
                  console.warn('Mismatching childNodes vs. VNodes: ', elm.childNodes, children);
                }
                return false
              }
            }
          }
        }
        if (isDef(data)) {
          var fullInvoke = false;
          for (var key in data) {
            if (!isRenderedModule(key)) {
              fullInvoke = true;
              invokeCreateHooks(vnode, insertedVnodeQueue);
              break
            }
          }
          if (!fullInvoke && data['class']) {
            // ensure collecting deps for deep class bindings for future updates
            traverse(data['class']);
          }
        }
      } else if (elm.data !== vnode.text) {
        elm.data = vnode.text;
      }
      return true
    }

    function assertNodeMatch (node, vnode, inVPre) {
      if (isDef(vnode.tag)) {
        return vnode.tag.indexOf('vue-component') === 0 || (
          !isUnknownElement(vnode, inVPre) &&
          vnode.tag.toLowerCase() === (node.tagName && node.tagName.toLowerCase())
        )
      } else {
        return node.nodeType === (vnode.isComment ? 8 : 3)
      }
    }

    /**
     * 1：新节点不存在，老节点存在，调用 destroy 销毁节点
     * 2：如果 oldVnode 是真实元素，表面首次渲染，创建新节点，并插入 body，然后移除老节点
     * 3：如果 oldVnode 不是真实元素，表示更新阶段，执行 patchVnode
    */
    return function patch (oldVnode, vnode, hydrating, removeOnly) {
      // 新节点不存在，老节点存在，销毁老节点
      if (isUndef(vnode)) {
        if (isDef(oldVnode)) { invokeDestroyHook(oldVnode); }
        return
      }

      var isInitialPatch = false;
      var insertedVnodeQueue = [];

      if (isUndef(oldVnode)) {
        // empty mount (likely as component), create new root element
        // 新节点存在,老节点不存在
        // 首次渲染组件时会进入
        // <div id='app'><comp></comp></div>  comp 组件初次渲染时，会进入
        isInitialPatch = true;
        createElm(vnode, insertedVnodeQueue);
      } else {
        // 判断 oldVnode 是否为一个真实元素
        var isRealElement = isDef(oldVnode.nodeType);
        if (!isRealElement && sameVnode(oldVnode, vnode)) {
          // patch existing root node
          // oldVnode 不是真实元素，而且oldVnode 和 Vnode 是同一个节点，进行 patch
          patchVnode(oldVnode, vnode, insertedVnodeQueue, null, null, removeOnly);
        } else {
          if (isRealElement) {
            // 真实节点
            // mounting to a real element
            // check if this is server-rendered content and if we can perform
            // a successful hydration.
            // 挂载到真实元素以及处理服务端渲染情况
            if (oldVnode.nodeType === 1 && oldVnode.hasAttribute(SSR_ATTR)) {
              oldVnode.removeAttribute(SSR_ATTR);
              hydrating = true;
            }
            if (isTrue(hydrating)) {
              if (hydrate(oldVnode, vnode, insertedVnodeQueue)) {
                invokeInsertHook(vnode, insertedVnodeQueue, true);
                return oldVnode
              } else {
                warn(
                  'The client-side rendered virtual DOM tree is not matching ' +
                  'server-rendered content. This is likely caused by incorrect ' +
                  'HTML markup, for example nesting block-level elements inside ' +
                  '<p>, or missing <tbody>. Bailing hydration and performing ' +
                  'full client-side render.'
                );
              }
            }
            // either not server-rendered, or hydration failed.
            // create an empty node and replace it
            // 基于 oldVnode，也就是真实节点创建一个 Vnode
            oldVnode = emptyNodeAt(oldVnode);
          }

          // replacing existing element
          // 获取节点的真实元素
          var oldElm = oldVnode.elm;
          // 获取节点的父节点，如 body 元素
          var parentElm = nodeOps.parentNode(oldElm);

          // create new node
          // 创建整个 DOM 树
          createElm(
            vnode,
            insertedVnodeQueue,
            // extremely rare edge case: do not insert if old element is in a
            // leaving transition. Only happens when combining transition +
            // keep-alive + HOCs. (#4590)
            oldElm._leaveCb ? null : parentElm,
            nodeOps.nextSibling(oldElm)
          );

          // update parent placeholder node element, recursively
          // 递归更新父占位符节点元素
          if (isDef(vnode.parent)) {
            var ancestor = vnode.parent;
            var patchable = isPatchable(vnode);
            while (ancestor) {
              for (var i = 0; i < cbs.destroy.length; ++i) {
                cbs.destroy[i](ancestor);
              }
              ancestor.elm = vnode.elm;
              if (patchable) {
                for (var i$1 = 0; i$1 < cbs.create.length; ++i$1) {
                  cbs.create[i$1](emptyNode, ancestor);
                }
                // #6513
                // invoke insert hooks that may have been merged by create hooks.
                // e.g. for directives that uses the "inserted" hook.
                var insert = ancestor.data.hook.insert;
                if (insert.merged) {
                  // start at index 1 to avoid re-invoking component mounted hook
                  for (var i$2 = 1; i$2 < insert.fns.length; i$2++) {
                    insert.fns[i$2]();
                  }
                }
              } else {
                registerRef(ancestor);
              }
              ancestor = ancestor.parent;
            }
          }

          // destroy old node
          // 移除老节点
          if (isDef(parentElm)) {
            removeVnodes([oldVnode], 0, 0);
          } else if (isDef(oldVnode.tag)) {
            invokeDestroyHook(oldVnode);
          }
        }
      }

      invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch);
      return vnode.elm
    }
  }

  /*  */

  var directives = {
    create: updateDirectives,
    update: updateDirectives,
    destroy: function unbindDirectives (vnode) {
      updateDirectives(vnode, emptyNode);
    }
  };

  // 新旧 VNode 中有一方涉及到了指令
  // 让指令生效，就是在合适的时机执行定义指令时所设置的钩子函数
  function updateDirectives (oldVnode, vnode) {
    if (oldVnode.data.directives || vnode.data.directives) {
      _update(oldVnode, vnode);
    }
  }

  function _update (oldVnode, vnode) {
    // 判断当前节点 VNode 对应的旧节点是不是一个空节点；如果是，表示当前节点是一个新创建的节点
    var isCreate = oldVnode === emptyNode;
    // 判断当前节点 VNode 是不是空节点；如果是，表示当前节点对应的旧节点将要被销毁
    var isDestroy = vnode === emptyNode;
    // 旧的指令集合
    var oldDirs = normalizeDirectives$1(oldVnode.data.directives, oldVnode.context);
    // 新的指令集合
    var newDirs = normalizeDirectives$1(vnode.data.directives, vnode.context);

    // 保存需要触发 inserted 指令钩子函数的指令列表 
    var dirsWithInsert = [];
    // 保存需要触发 componentUpdated 指令钩子函数的指令列表 
    var dirsWithPostpatch = [];

    var key, oldDir, dir;
    for (key in newDirs) {
      oldDir = oldDirs[key];
      dir = newDirs[key];
      // 判断当前的指令名 key 在旧的指令列表中是否存在；不存在，首次绑定到元素上的新指令
      if (!oldDir) {
        // new directive, bind
        // 触发指令中的 bind 钩子函数
        callHook$1(dir, 'bind', vnode, oldVnode);
        // 如果定义 inserted 时的钩子函数
        if (dir.def && dir.def.inserted) {
          // 添加到 dirsWithInsert 中
          dirsWithInsert.push(dir);
        }
      } else {
        // existing directive, update
        // 保存上一次指令的 value 和 arg 属性值
        dir.oldValue = oldDir.value;
        dir.oldArg = oldDir.arg;
        // 触发指令中的 update 钩子函数
        callHook$1(dir, 'update', vnode, oldVnode);
        if (dir.def && dir.def.componentUpdated) {
          dirsWithPostpatch.push(dir);
        }
      }
    }

    if (dirsWithInsert.length) {
      var callInsert = function () {
        for (var i = 0; i < dirsWithInsert.length; i++) {
          // 循环执行 inserted 钩子函数
          callHook$1(dirsWithInsert[i], 'inserted', vnode, oldVnode);
        }
      };
      if (isCreate) {
        mergeVNodeHook(vnode, 'insert', callInsert);
      } else {
        callInsert();
      }
    }

    if (dirsWithPostpatch.length) {
      mergeVNodeHook(vnode, 'postpatch', function () {
        for (var i = 0; i < dirsWithPostpatch.length; i++) {
          callHook$1(dirsWithPostpatch[i], 'componentUpdated', vnode, oldVnode);
        }
      });
    }

    if (!isCreate) {
      for (key in oldDirs) {
        // 旧的指令列表有，新的指令列表没有，该指令是被废弃的
        if (!newDirs[key]) {
          // no longer present, unbind
          // 触发 unbind 进行解绑
          callHook$1(oldDirs[key], 'unbind', oldVnode, oldVnode, isDestroy);
        }
      }
    }
  }

  var emptyModifiers = Object.create(null);

  function normalizeDirectives$1 (
    dirs,
    vm
  ) {
    var res = Object.create(null);
    if (!dirs) {
      // $flow-disable-line
      return res
    }
    var i, dir;
    for (i = 0; i < dirs.length; i++) {
      dir = dirs[i];
      if (!dir.modifiers) {
        // $flow-disable-line
        dir.modifiers = emptyModifiers;
      }
      res[getRawDirName(dir)] = dir;
      dir.def = resolveAsset(vm.$options, 'directives', dir.name, true);
    }
    // $flow-disable-line
    return res
  }

  function getRawDirName (dir) {
    return dir.rawName || ((dir.name) + "." + (Object.keys(dir.modifiers || {}).join('.')))
  }

  function callHook$1 (dir, hook, vnode, oldVnode, isDestroy) {
    var fn = dir.def && dir.def[hook];
    if (fn) {
      try {
        fn(vnode.elm, dir, vnode, oldVnode, isDestroy);
      } catch (e) {
        handleError(e, vnode.context, ("directive " + (dir.name) + " " + hook + " hook"));
      }
    }
  }

  var baseModules = [
    ref,
    directives
  ];

  /*  */

  function updateAttrs (oldVnode, vnode) {
    var opts = vnode.componentOptions;
    if (isDef(opts) && opts.Ctor.options.inheritAttrs === false) {
      return
    }
    if (isUndef(oldVnode.data.attrs) && isUndef(vnode.data.attrs)) {
      return
    }
    var key, cur, old;
    var elm = vnode.elm;
    var oldAttrs = oldVnode.data.attrs || {};
    var attrs = vnode.data.attrs || {};
    // clone observed objects, as the user probably wants to mutate it
    if (isDef(attrs.__ob__)) {
      attrs = vnode.data.attrs = extend({}, attrs);
    }

    for (key in attrs) {
      cur = attrs[key];
      old = oldAttrs[key];
      if (old !== cur) {
        setAttr(elm, key, cur, vnode.data.pre);
      }
    }
    // #4391: in IE9, setting type can reset value for input[type=radio]
    // #6666: IE/Edge forces progress value down to 1 before setting a max
    /* istanbul ignore if */
    if ((isIE || isEdge) && attrs.value !== oldAttrs.value) {
      setAttr(elm, 'value', attrs.value);
    }
    for (key in oldAttrs) {
      if (isUndef(attrs[key])) {
        if (isXlink(key)) {
          elm.removeAttributeNS(xlinkNS, getXlinkProp(key));
        } else if (!isEnumeratedAttr(key)) {
          elm.removeAttribute(key);
        }
      }
    }
  }

  function setAttr (el, key, value, isInPre) {
    if (isInPre || el.tagName.indexOf('-') > -1) {
      baseSetAttr(el, key, value);
    } else if (isBooleanAttr(key)) {
      // set attribute for blank value
      // e.g. <option disabled>Select one</option>
      if (isFalsyAttrValue(value)) {
        el.removeAttribute(key);
      } else {
        // technically allowfullscreen is a boolean attribute for <iframe>,
        // but Flash expects a value of "true" when used on <embed> tag
        value = key === 'allowfullscreen' && el.tagName === 'EMBED'
          ? 'true'
          : key;
        el.setAttribute(key, value);
      }
    } else if (isEnumeratedAttr(key)) {
      el.setAttribute(key, convertEnumeratedValue(key, value));
    } else if (isXlink(key)) {
      if (isFalsyAttrValue(value)) {
        el.removeAttributeNS(xlinkNS, getXlinkProp(key));
      } else {
        el.setAttributeNS(xlinkNS, key, value);
      }
    } else {
      baseSetAttr(el, key, value);
    }
  }

  function baseSetAttr (el, key, value) {
    if (isFalsyAttrValue(value)) {
      el.removeAttribute(key);
    } else {
      // #7138: IE10 & 11 fires input event when setting placeholder on
      // <textarea>... block the first input event and remove the blocker
      // immediately.
      /* istanbul ignore if */
      if (
        isIE && !isIE9 &&
        el.tagName === 'TEXTAREA' &&
        key === 'placeholder' && value !== '' && !el.__ieph
      ) {
        var blocker = function (e) {
          e.stopImmediatePropagation();
          el.removeEventListener('input', blocker);
        };
        el.addEventListener('input', blocker);
        // $flow-disable-line
        el.__ieph = true; /* IE placeholder patched */
      }
      el.setAttribute(key, value);
    }
  }

  var attrs = {
    create: updateAttrs,
    update: updateAttrs
  };

  /*  */

  function updateClass (oldVnode, vnode) {
    var el = vnode.elm;
    var data = vnode.data;
    var oldData = oldVnode.data;
    if (
      isUndef(data.staticClass) &&
      isUndef(data.class) && (
        isUndef(oldData) || (
          isUndef(oldData.staticClass) &&
          isUndef(oldData.class)
        )
      )
    ) {
      return
    }

    var cls = genClassForVnode(vnode);

    // handle transition classes
    var transitionClass = el._transitionClasses;
    if (isDef(transitionClass)) {
      cls = concat(cls, stringifyClass(transitionClass));
    }

    // set the class
    if (cls !== el._prevClass) {
      el.setAttribute('class', cls);
      el._prevClass = cls;
    }
  }

  var klass = {
    create: updateClass,
    update: updateClass
  };

  /*  */

  var validDivisionCharRE = /[\w).+\-_$\]]/;

  function parseFilters (exp) {
    // exp 是否在 '' 中
    var inSingle = false;
    // exp 是否在 "" 中
    var inDouble = false;
    // exp 是否在 `` 中
    var inTemplateString = false;
    // exp 是否在 \\ 中
    var inRegex = false;
    // 在exp中发现一个 { 则curly加1，发现一个 } 则curly减1，直到curly为0 说明 { ... }闭合
    var curly = 0;
    // 作用同上，发现的是 [ 和 ] 符号
    var square = 0;
    // 作用同上，发现的是 ( 和 ) 符号
    var paren = 0;
    // 解析游标，每循环过一个字符串游标加1
    var lastFilterIndex = 0;
    var c, prev, i, expression, filters;

    for (i = 0; i < exp.length; i++) {
      prev = c;
      c = exp.charCodeAt(i);
      if (inSingle) {
        if (c === 0x27 && prev !== 0x5C) { inSingle = false; }
      } else if (inDouble) {
        if (c === 0x22 && prev !== 0x5C) { inDouble = false; }
      } else if (inTemplateString) {
        if (c === 0x60 && prev !== 0x5C) { inTemplateString = false; }
      } else if (inRegex) {
        if (c === 0x2f && prev !== 0x5C) { inRegex = false; }
      } else if (
        c === 0x7C && // pipe
        exp.charCodeAt(i + 1) !== 0x7C &&
        exp.charCodeAt(i - 1) !== 0x7C &&
        !curly && !square && !paren
      ) {
        if (expression === undefined) {
          // first filter, end of expression
          lastFilterIndex = i + 1;
          expression = exp.slice(0, i).trim();
        } else {
          pushFilter();
        }
      } else {
        switch (c) {
          case 0x22: inDouble = true; break         // "
          case 0x27: inSingle = true; break         // '
          case 0x60: inTemplateString = true; break // `
          case 0x28: paren++; break                 // (
          case 0x29: paren--; break                 // )
          case 0x5B: square++; break                // [
          case 0x5D: square--; break                // ]
          case 0x7B: curly++; break                 // {
          case 0x7D: curly--; break                 // }
        }
        if (c === 0x2f) { // /
          var j = i - 1;
          var p = (void 0);
          // find first non-whitespace prev char
          for (; j >= 0; j--) {
            p = exp.charAt(j);
            if (p !== ' ') { break }
          }
          if (!p || !validDivisionCharRE.test(p)) {
            inRegex = true;
          }
        }
      }
    }

    if (expression === undefined) {
      expression = exp.slice(0, i).trim();
    } else if (lastFilterIndex !== 0) {
      pushFilter();
    }

    function pushFilter () {
      (filters || (filters = [])).push(exp.slice(lastFilterIndex, i).trim());
      lastFilterIndex = i + 1;
    }

    if (filters) {
      for (i = 0; i < filters.length; i++) {
        expression = wrapFilter(expression, filters[i]);
      }
    }

    return expression
  }

  function wrapFilter (exp, filter) {
    // 检查是否有 ( 来判断过滤器中是否有参数
    var i = filter.indexOf('(');
    if (i < 0) {
      // _f: resolveFilter
      return ("_f(\"" + filter + "\")(" + exp + ")")
    } else {
      var name = filter.slice(0, i);
      var args = filter.slice(i + 1);
      return ("_f(\"" + name + "\")(" + exp + (args !== ')' ? ',' + args : args))
    }
  }

  /*  */



  /* eslint-disable no-unused-vars */
  function baseWarn (msg, range) {
    console.error(("[Vue compiler]: " + msg));
  }
  /* eslint-enable no-unused-vars */

  function pluckModuleFunction (
    modules,
    key
  ) {
    return modules
      ? modules.map(function (m) { return m[key]; }).filter(function (_) { return _; })
      : []
  }

  function addProp (el, name, value, range, dynamic) {
    (el.props || (el.props = [])).push(rangeSetItem({ name: name, value: value, dynamic: dynamic }, range));
    el.plain = false;
  }

  function addAttr (el, name, value, range, dynamic) {
    var attrs = dynamic
      ? (el.dynamicAttrs || (el.dynamicAttrs = []))
      : (el.attrs || (el.attrs = []));
    attrs.push(rangeSetItem({ name: name, value: value, dynamic: dynamic }, range));
    el.plain = false;
  }

  // add a raw attr (use this in preTransforms)
  // 在 el.attrsMap 和 el.attrsList 中添加指定的属性
  function addRawAttr (el, name, value, range) {
    el.attrsMap[name] = value;
    el.attrsList.push(rangeSetItem({ name: name, value: value }, range));
  }

  function addDirective (
    el,
    name,
    rawName,
    value,
    arg,
    isDynamicArg,
    modifiers,
    range
  ) {
    (el.directives || (el.directives = [])).push(rangeSetItem({
      name: name,
      rawName: rawName,
      value: value,
      arg: arg,
      isDynamicArg: isDynamicArg,
      modifiers: modifiers
    }, range));
    el.plain = false;
  }

  function prependModifierMarker (symbol, name, dynamic) {
    return dynamic
      ? ("_p(" + name + ",\"" + symbol + "\")")
      : symbol + name // mark the event as captured
  }

  // 处理事件属性，将事件属性添加到 el.events 对象或者 el.nativeEvents 对象中
  function addHandler (
    // ast 对象
    el,
    // 属性名，即事件名
    name,
    // 属性值，即事件回调函数名
    value,
    // 修饰符
    modifiers,
    important,
    // 日志
    warn,
    range,
    // 属性名是否为动态属性
    dynamic
  ) {
    // modifiers 是一个对象，如果传递的参数为空，则给一个冻结的空对象
    modifiers = modifiers || emptyObject;
    // warn prevent and passive modifier
    /* istanbul ignore if */
    if (
       warn &&
      modifiers.prevent && modifiers.passive
    ) {
      warn(
        'passive and prevent can\'t be used together. ' +
        'Passive handler can\'t prevent default event.',
        range
      );
    }

    // normalize click.right and click.middle since they don't actually fire
    // this is technically browser-specific, but at least for now browsers are
    // the only target envs that have right/middle clicks.
    // 处理鼠标的中键、右键
    if (modifiers.right) {
      if (dynamic) {
        // 动态属性
        name = "(" + name + ")==='click'?'contextmenu':(" + name + ")";
      } else if (name === 'click') {
        name = 'contextmenu';
        delete modifiers.right;
      }
    } else if (modifiers.middle) {
      if (dynamic) {
        name = "(" + name + ")==='click'?'mouseup':(" + name + ")";
      } else if (name === 'click') {
        name = 'mouseup';
      }
    }

    // check capture modifier
    // 分别处理 capture、once、passive 修饰符，在名称中加一些前缀作为标识
    if (modifiers.capture) {
      delete modifiers.capture;
      // 加上 ！ 标记
      name = prependModifierMarker('!', name, dynamic);
    }
    if (modifiers.once) {
      delete modifiers.once;
      // 加上 ~ 标记
      name = prependModifierMarker('~', name, dynamic);
    }
    /* istanbul ignore if */
    if (modifiers.passive) {
      delete modifiers.passive;
      // 加上 & 标记
      name = prependModifierMarker('&', name, dynamic);
    }

    // 处理事件
    var events;
    if (modifiers.native) {
      // native 修饰符，原生事件
      delete modifiers.native;
      events = el.nativeEvents || (el.nativeEvents = {});
    } else {
      events = el.events || (el.events = {});
    }

    var newHandler = rangeSetItem({ value: value.trim(), dynamic: dynamic }, range);
    if (modifiers !== emptyObject) {
      newHandler.modifiers = modifiers;
    }

    var handlers = events[name];
    /* istanbul ignore if */
    if (Array.isArray(handlers)) {
      important ? handlers.unshift(newHandler) : handlers.push(newHandler);
    } else if (handlers) {
      events[name] = important ? [newHandler, handlers] : [handlers, newHandler];
    } else {
      events[name] = newHandler;
    }

    el.plain = false;
  }

  function getRawBindingAttr (
    el,
    name
  ) {
    return el.rawAttrsMap[':' + name] ||
      el.rawAttrsMap['v-bind:' + name] ||
      el.rawAttrsMap[name]
  }

  // 获取 el 对象上执行属性 name 的值
  function getBindingAttr (
    el,
    name,
    getStatic
  ) {
    var dynamicValue =
      getAndRemoveAttr(el, ':' + name) ||
      getAndRemoveAttr(el, 'v-bind:' + name);
    if (dynamicValue != null) {
      return parseFilters(dynamicValue)
    } else if (getStatic !== false) {
      var staticValue = getAndRemoveAttr(el, name);
      if (staticValue != null) {
        return JSON.stringify(staticValue)
      }
    }
  }

  // note: this only removes the attr from the Array (attrsList) so that it
  // doesn't get processed by processAttrs.
  // By default it does NOT remove it from the map (attrsMap) because the map is
  // needed during codegen.
  function getAndRemoveAttr (
    el,
    name,
    removeFromMap
  ) {
    var val;
    if ((val = el.attrsMap[name]) != null) {
      var list = el.attrsList;
      // 将执行属性 name 从 el.attrsList
      for (var i = 0, l = list.length; i < l; i++) {
        if (list[i].name === name) {
          list.splice(i, 1);
          break
        }
      }
    }
    // removeFromMap 属性为 true ，则从 el.attrsMap 中移除指定的属性 name
    // 一般不会移除，因为 ast 生成代码期间还需要使用该对象
    if (removeFromMap) {
      delete el.attrsMap[name];
    }
    // 返回执行属性的值
    return val
  }

  function getAndRemoveAttrByRegex (
    el,
    name
  ) {
    var list = el.attrsList;
    for (var i = 0, l = list.length; i < l; i++) {
      var attr = list[i];
      if (name.test(attr.name)) {
        list.splice(i, 1);
        return attr
      }
    }
  }

  function rangeSetItem (
    item,
    range
  ) {
    if (range) {
      if (range.start != null) {
        item.start = range.start;
      }
      if (range.end != null) {
        item.end = range.end;
      }
    }
    return item
  }

  /*  */

  /**
   * Cross-platform code generation for component v-model
   */
  function genComponentModel (
    el,
    value,
    modifiers
  ) {
    var ref = modifiers || {};
    var number = ref.number;
    var trim = ref.trim;

    var baseValueExpression = '$$v';
    var valueExpression = baseValueExpression;
    if (trim) {
      valueExpression =
        "(typeof " + baseValueExpression + " === 'string'" +
        "? " + baseValueExpression + ".trim()" +
        ": " + baseValueExpression + ")";
    }
    if (number) {
      valueExpression = "_n(" + valueExpression + ")";
    }
    var assignment = genAssignmentCode(value, valueExpression);

    el.model = {
      value: ("(" + value + ")"),
      expression: JSON.stringify(value),
      callback: ("function (" + baseValueExpression + ") {" + assignment + "}")
    };
  }

  /**
   * Cross-platform codegen helper for generating v-model value assignment code.
   */
  function genAssignmentCode (
    value,
    assignment
  ) {
    var res = parseModel(value);
    if (res.key === null) {
      return (value + "=" + assignment)
    } else {
      return ("$set(" + (res.exp) + ", " + (res.key) + ", " + assignment + ")")
    }
  }

  /**
   * Parse a v-model expression into a base path and a final key segment.
   * Handles both dot-path and possible square brackets.
   *
   * Possible cases:
   *
   * - test
   * - test[key]
   * - test[test1[key]]
   * - test["a"][key]
   * - xxx.test[a[a].test1[key]]
   * - test.xxx.a["asa"][test1[key]]
   *
   */

  var len, str, chr, index$1, expressionPos, expressionEndPos;



  function parseModel (val) {
    // Fix https://github.com/vuejs/vue/pull/7730
    // allow v-model="obj.val " (trailing whitespace)
    val = val.trim();
    len = val.length;

    if (val.indexOf('[') < 0 || val.lastIndexOf(']') < len - 1) {
      index$1 = val.lastIndexOf('.');
      if (index$1 > -1) {
        return {
          exp: val.slice(0, index$1),
          key: '"' + val.slice(index$1 + 1) + '"'
        }
      } else {
        return {
          exp: val,
          key: null
        }
      }
    }

    str = val;
    index$1 = expressionPos = expressionEndPos = 0;

    while (!eof()) {
      chr = next();
      /* istanbul ignore if */
      if (isStringStart(chr)) {
        parseString(chr);
      } else if (chr === 0x5B) {
        parseBracket(chr);
      }
    }

    return {
      exp: val.slice(0, expressionPos),
      key: val.slice(expressionPos + 1, expressionEndPos)
    }
  }

  function next () {
    return str.charCodeAt(++index$1)
  }

  function eof () {
    return index$1 >= len
  }

  function isStringStart (chr) {
    return chr === 0x22 || chr === 0x27
  }

  function parseBracket (chr) {
    var inBracket = 1;
    expressionPos = index$1;
    while (!eof()) {
      chr = next();
      if (isStringStart(chr)) {
        parseString(chr);
        continue
      }
      if (chr === 0x5B) { inBracket++; }
      if (chr === 0x5D) { inBracket--; }
      if (inBracket === 0) {
        expressionEndPos = index$1;
        break
      }
    }
  }

  function parseString (chr) {
    var stringQuote = chr;
    while (!eof()) {
      chr = next();
      if (chr === stringQuote) {
        break
      }
    }
  }

  /*  */

  var warn$1;

  // in some cases, the event used has to be determined at runtime
  // so we used some reserved tokens during compile.
  var RANGE_TOKEN = '__r';
  var CHECKBOX_RADIO_TOKEN = '__c';

  function model (
    el,
    dir,
    _warn
  ) {
    warn$1 = _warn;
    var value = dir.value;
    var modifiers = dir.modifiers;
    var tag = el.tag;
    var type = el.attrsMap.type;

    {
      // inputs with type="file" are read only and setting the input's
      // value will throw an error.
      if (tag === 'input' && type === 'file') {
        warn$1(
          "<" + (el.tag) + " v-model=\"" + value + "\" type=\"file\">:\n" +
          "File inputs are read only. Use a v-on:change listener instead.",
          el.rawAttrsMap['v-model']
        );
      }
    }

    if (el.component) {
      genComponentModel(el, value, modifiers);
      // component v-model doesn't need extra runtime
      return false
    } else if (tag === 'select') {
      genSelect(el, value, modifiers);
    } else if (tag === 'input' && type === 'checkbox') {
      genCheckboxModel(el, value, modifiers);
    } else if (tag === 'input' && type === 'radio') {
      genRadioModel(el, value, modifiers);
    } else if (tag === 'input' || tag === 'textarea') {
      genDefaultModel(el, value, modifiers);
    } else if (!config.isReservedTag(tag)) {
      genComponentModel(el, value, modifiers);
      // component v-model doesn't need extra runtime
      return false
    } else {
      warn$1(
        "<" + (el.tag) + " v-model=\"" + value + "\">: " +
        "v-model is not supported on this element type. " +
        'If you are working with contenteditable, it\'s recommended to ' +
        'wrap a library dedicated for that purpose inside a custom component.',
        el.rawAttrsMap['v-model']
      );
    }

    // ensure runtime directive metadata
    return true
  }

  function genCheckboxModel (
    el,
    value,
    modifiers
  ) {
    var number = modifiers && modifiers.number;
    var valueBinding = getBindingAttr(el, 'value') || 'null';
    var trueValueBinding = getBindingAttr(el, 'true-value') || 'true';
    var falseValueBinding = getBindingAttr(el, 'false-value') || 'false';
    addProp(el, 'checked',
      "Array.isArray(" + value + ")" +
      "?_i(" + value + "," + valueBinding + ")>-1" + (
        trueValueBinding === 'true'
          ? (":(" + value + ")")
          : (":_q(" + value + "," + trueValueBinding + ")")
      )
    );
    addHandler(el, 'change',
      "var $$a=" + value + "," +
          '$$el=$event.target,' +
          "$$c=$$el.checked?(" + trueValueBinding + "):(" + falseValueBinding + ");" +
      'if(Array.isArray($$a)){' +
        "var $$v=" + (number ? '_n(' + valueBinding + ')' : valueBinding) + "," +
            '$$i=_i($$a,$$v);' +
        "if($$el.checked){$$i<0&&(" + (genAssignmentCode(value, '$$a.concat([$$v])')) + ")}" +
        "else{$$i>-1&&(" + (genAssignmentCode(value, '$$a.slice(0,$$i).concat($$a.slice($$i+1))')) + ")}" +
      "}else{" + (genAssignmentCode(value, '$$c')) + "}",
      null, true
    );
  }

  function genRadioModel (
    el,
    value,
    modifiers
  ) {
    var number = modifiers && modifiers.number;
    var valueBinding = getBindingAttr(el, 'value') || 'null';
    valueBinding = number ? ("_n(" + valueBinding + ")") : valueBinding;
    addProp(el, 'checked', ("_q(" + value + "," + valueBinding + ")"));
    addHandler(el, 'change', genAssignmentCode(value, valueBinding), null, true);
  }

  function genSelect (
    el,
    value,
    modifiers
  ) {
    var number = modifiers && modifiers.number;
    var selectedVal = "Array.prototype.filter" +
      ".call($event.target.options,function(o){return o.selected})" +
      ".map(function(o){var val = \"_value\" in o ? o._value : o.value;" +
      "return " + (number ? '_n(val)' : 'val') + "})";

    var assignment = '$event.target.multiple ? $$selectedVal : $$selectedVal[0]';
    var code = "var $$selectedVal = " + selectedVal + ";";
    code = code + " " + (genAssignmentCode(value, assignment));
    addHandler(el, 'change', code, null, true);
  }

  function genDefaultModel (
    el,
    value,
    modifiers
  ) {
    var type = el.attrsMap.type;

    // warn if v-bind:value conflicts with v-model
    // except for inputs with v-bind:type
    {
      var value$1 = el.attrsMap['v-bind:value'] || el.attrsMap[':value'];
      var typeBinding = el.attrsMap['v-bind:type'] || el.attrsMap[':type'];
      if (value$1 && !typeBinding) {
        var binding = el.attrsMap['v-bind:value'] ? 'v-bind:value' : ':value';
        warn$1(
          binding + "=\"" + value$1 + "\" conflicts with v-model on the same element " +
          'because the latter already expands to a value binding internally',
          el.rawAttrsMap[binding]
        );
      }
    }

    var ref = modifiers || {};
    var lazy = ref.lazy;
    var number = ref.number;
    var trim = ref.trim;
    var needCompositionGuard = !lazy && type !== 'range';
    var event = lazy
      ? 'change'
      : type === 'range'
        ? RANGE_TOKEN
        : 'input';

    var valueExpression = '$event.target.value';
    if (trim) {
      valueExpression = "$event.target.value.trim()";
    }
    if (number) {
      valueExpression = "_n(" + valueExpression + ")";
    }

    var code = genAssignmentCode(value, valueExpression);
    if (needCompositionGuard) {
      code = "if($event.target.composing)return;" + code;
    }

    addProp(el, 'value', ("(" + value + ")"));
    addHandler(el, event, code, null, true);
    if (trim || number) {
      addHandler(el, 'blur', '$forceUpdate()');
    }
  }

  /*  */

  // normalize v-model event tokens that can only be determined at runtime.
  // it's important to place the event as the first in the array because
  // the whole point is ensuring the v-model callback gets called before
  // user-attached handlers.
  function normalizeEvents (on) {
    /* istanbul ignore if */
    if (isDef(on[RANGE_TOKEN])) {
      // IE input[type=range] only supports `change` event
      var event = isIE ? 'change' : 'input';
      on[event] = [].concat(on[RANGE_TOKEN], on[event] || []);
      delete on[RANGE_TOKEN];
    }
    // This was originally intended to fix #4521 but no longer necessary
    // after 2.5. Keeping it for backwards compat with generated code from < 2.4
    /* istanbul ignore if */
    if (isDef(on[CHECKBOX_RADIO_TOKEN])) {
      on.change = [].concat(on[CHECKBOX_RADIO_TOKEN], on.change || []);
      delete on[CHECKBOX_RADIO_TOKEN];
    }
  }

  var target$1;

  function createOnceHandler$1 (event, handler, capture) {
    var _target = target$1; // save current target element in closure
    return function onceHandler () {
      var res = handler.apply(null, arguments);
      if (res !== null) {
        remove$2(event, onceHandler, capture, _target);
      }
    }
  }

  // #9446: Firefox <= 53 (in particular, ESR 52) has incorrect Event.timeStamp
  // implementation and does not fire microtasks in between event propagation, so
  // safe to exclude.
  var useMicrotaskFix = isUsingMicroTask && !(isFF && Number(isFF[1]) <= 53);

  function add$1 (
    name,
    handler,
    capture,
    passive
  ) {
    // async edge case #6566: inner click event triggers patch, event handler
    // attached to outer element during patch, and triggered again. This
    // happens because browsers fire microtask ticks between event propagation.
    // the solution is simple: we save the timestamp when a handler is attached,
    // and the handler would only fire if the event passed to it was fired
    // AFTER it was attached.
    if (useMicrotaskFix) {
      var attachedTimestamp = currentFlushTimestamp;
      var original = handler;
      handler = original._wrapper = function (e) {
        if (
          // no bubbling, should always fire.
          // this is just a safety net in case event.timeStamp is unreliable in
          // certain weird environments...
          e.target === e.currentTarget ||
          // event is fired after handler attachment
          e.timeStamp >= attachedTimestamp ||
          // bail for environments that have buggy event.timeStamp implementations
          // #9462 iOS 9 bug: event.timeStamp is 0 after history.pushState
          // #9681 QtWebEngine event.timeStamp is negative value
          e.timeStamp <= 0 ||
          // #9448 bail if event is fired in another document in a multi-page
          // electron/nw.js app, since event.timeStamp will be using a different
          // starting reference
          e.target.ownerDocument !== document
        ) {
          return original.apply(this, arguments)
        }
      };
    }
    target$1.addEventListener(
      name,
      handler,
      supportsPassive
        ? { capture: capture, passive: passive }
        : capture
    );
  }

  function remove$2 (
    name,
    handler,
    capture,
    _target
  ) {
    (_target || target$1).removeEventListener(
      name,
      handler._wrapper || handler,
      capture
    );
  }

  function updateDOMListeners (oldVnode, vnode) {
    if (isUndef(oldVnode.data.on) && isUndef(vnode.data.on)) {
      return
    }
    var on = vnode.data.on || {};
    var oldOn = oldVnode.data.on || {};
    target$1 = vnode.elm;
    normalizeEvents(on);
    updateListeners(on, oldOn, add$1, remove$2, createOnceHandler$1, vnode.context);
    target$1 = undefined;
  }

  var events = {
    create: updateDOMListeners,
    update: updateDOMListeners
  };

  /*  */

  var svgContainer;

  function updateDOMProps (oldVnode, vnode) {
    if (isUndef(oldVnode.data.domProps) && isUndef(vnode.data.domProps)) {
      return
    }
    var key, cur;
    var elm = vnode.elm;
    var oldProps = oldVnode.data.domProps || {};
    var props = vnode.data.domProps || {};
    // clone observed objects, as the user probably wants to mutate it
    if (isDef(props.__ob__)) {
      props = vnode.data.domProps = extend({}, props);
    }

    for (key in oldProps) {
      if (!(key in props)) {
        elm[key] = '';
      }
    }

    for (key in props) {
      cur = props[key];
      // ignore children if the node has textContent or innerHTML,
      // as these will throw away existing DOM nodes and cause removal errors
      // on subsequent patches (#3360)
      if (key === 'textContent' || key === 'innerHTML') {
        if (vnode.children) { vnode.children.length = 0; }
        if (cur === oldProps[key]) { continue }
        // #6601 work around Chrome version <= 55 bug where single textNode
        // replaced by innerHTML/textContent retains its parentNode property
        if (elm.childNodes.length === 1) {
          elm.removeChild(elm.childNodes[0]);
        }
      }

      if (key === 'value' && elm.tagName !== 'PROGRESS') {
        // store value as _value as well since
        // non-string values will be stringified
        elm._value = cur;
        // avoid resetting cursor position when value is the same
        var strCur = isUndef(cur) ? '' : String(cur);
        if (shouldUpdateValue(elm, strCur)) {
          elm.value = strCur;
        }
      } else if (key === 'innerHTML' && isSVG(elm.tagName) && isUndef(elm.innerHTML)) {
        // IE doesn't support innerHTML for SVG elements
        svgContainer = svgContainer || document.createElement('div');
        svgContainer.innerHTML = "<svg>" + cur + "</svg>";
        var svg = svgContainer.firstChild;
        while (elm.firstChild) {
          elm.removeChild(elm.firstChild);
        }
        while (svg.firstChild) {
          elm.appendChild(svg.firstChild);
        }
      } else if (
        // skip the update if old and new VDOM state is the same.
        // `value` is handled separately because the DOM value may be temporarily
        // out of sync with VDOM state due to focus, composition and modifiers.
        // This  #4521 by skipping the unnecessary `checked` update.
        cur !== oldProps[key]
      ) {
        // some property updates can throw
        // e.g. `value` on <progress> w/ non-finite value
        try {
          elm[key] = cur;
        } catch (e) {}
      }
    }
  }

  // check platforms/web/util/attrs.js acceptValue


  function shouldUpdateValue (elm, checkVal) {
    return (!elm.composing && (
      elm.tagName === 'OPTION' ||
      isNotInFocusAndDirty(elm, checkVal) ||
      isDirtyWithModifiers(elm, checkVal)
    ))
  }

  function isNotInFocusAndDirty (elm, checkVal) {
    // return true when textbox (.number and .trim) loses focus and its value is
    // not equal to the updated value
    var notInFocus = true;
    // #6157
    // work around IE bug when accessing document.activeElement in an iframe
    try { notInFocus = document.activeElement !== elm; } catch (e) {}
    return notInFocus && elm.value !== checkVal
  }

  function isDirtyWithModifiers (elm, newVal) {
    var value = elm.value;
    var modifiers = elm._vModifiers; // injected by v-model runtime
    if (isDef(modifiers)) {
      if (modifiers.number) {
        return toNumber(value) !== toNumber(newVal)
      }
      if (modifiers.trim) {
        return value.trim() !== newVal.trim()
      }
    }
    return value !== newVal
  }

  var domProps = {
    create: updateDOMProps,
    update: updateDOMProps
  };

  /*  */

  var parseStyleText = cached(function (cssText) {
    var res = {};
    var listDelimiter = /;(?![^(]*\))/g;
    var propertyDelimiter = /:(.+)/;
    cssText.split(listDelimiter).forEach(function (item) {
      if (item) {
        var tmp = item.split(propertyDelimiter);
        tmp.length > 1 && (res[tmp[0].trim()] = tmp[1].trim());
      }
    });
    return res
  });

  // merge static and dynamic style data on the same vnode
  function normalizeStyleData (data) {
    var style = normalizeStyleBinding(data.style);
    // static style is pre-processed into an object during compilation
    // and is always a fresh object, so it's safe to merge into it
    return data.staticStyle
      ? extend(data.staticStyle, style)
      : style
  }

  // normalize possible array / string values into Object
  function normalizeStyleBinding (bindingStyle) {
    if (Array.isArray(bindingStyle)) {
      return toObject(bindingStyle)
    }
    if (typeof bindingStyle === 'string') {
      return parseStyleText(bindingStyle)
    }
    return bindingStyle
  }

  /**
   * parent component style should be after child's
   * so that parent component's style could override it
   */
  function getStyle (vnode, checkChild) {
    var res = {};
    var styleData;

    if (checkChild) {
      var childNode = vnode;
      while (childNode.componentInstance) {
        childNode = childNode.componentInstance._vnode;
        if (
          childNode && childNode.data &&
          (styleData = normalizeStyleData(childNode.data))
        ) {
          extend(res, styleData);
        }
      }
    }

    if ((styleData = normalizeStyleData(vnode.data))) {
      extend(res, styleData);
    }

    var parentNode = vnode;
    while ((parentNode = parentNode.parent)) {
      if (parentNode.data && (styleData = normalizeStyleData(parentNode.data))) {
        extend(res, styleData);
      }
    }
    return res
  }

  /*  */

  var cssVarRE = /^--/;
  var importantRE = /\s*!important$/;
  var setProp = function (el, name, val) {
    /* istanbul ignore if */
    if (cssVarRE.test(name)) {
      el.style.setProperty(name, val);
    } else if (importantRE.test(val)) {
      el.style.setProperty(hyphenate(name), val.replace(importantRE, ''), 'important');
    } else {
      var normalizedName = normalize(name);
      if (Array.isArray(val)) {
        // Support values array created by autoprefixer, e.g.
        // {display: ["-webkit-box", "-ms-flexbox", "flex"]}
        // Set them one by one, and the browser will only set those it can recognize
        for (var i = 0, len = val.length; i < len; i++) {
          el.style[normalizedName] = val[i];
        }
      } else {
        el.style[normalizedName] = val;
      }
    }
  };

  var vendorNames = ['Webkit', 'Moz', 'ms'];

  var emptyStyle;
  var normalize = cached(function (prop) {
    emptyStyle = emptyStyle || document.createElement('div').style;
    prop = camelize(prop);
    if (prop !== 'filter' && (prop in emptyStyle)) {
      return prop
    }
    var capName = prop.charAt(0).toUpperCase() + prop.slice(1);
    for (var i = 0; i < vendorNames.length; i++) {
      var name = vendorNames[i] + capName;
      if (name in emptyStyle) {
        return name
      }
    }
  });

  function updateStyle (oldVnode, vnode) {
    var data = vnode.data;
    var oldData = oldVnode.data;

    if (isUndef(data.staticStyle) && isUndef(data.style) &&
      isUndef(oldData.staticStyle) && isUndef(oldData.style)
    ) {
      return
    }

    var cur, name;
    var el = vnode.elm;
    var oldStaticStyle = oldData.staticStyle;
    var oldStyleBinding = oldData.normalizedStyle || oldData.style || {};

    // if static style exists, stylebinding already merged into it when doing normalizeStyleData
    var oldStyle = oldStaticStyle || oldStyleBinding;

    var style = normalizeStyleBinding(vnode.data.style) || {};

    // store normalized style under a different key for next diff
    // make sure to clone it if it's reactive, since the user likely wants
    // to mutate it.
    vnode.data.normalizedStyle = isDef(style.__ob__)
      ? extend({}, style)
      : style;

    var newStyle = getStyle(vnode, true);

    for (name in oldStyle) {
      if (isUndef(newStyle[name])) {
        setProp(el, name, '');
      }
    }
    for (name in newStyle) {
      cur = newStyle[name];
      if (cur !== oldStyle[name]) {
        // ie9 setting to null has no effect, must use empty string
        setProp(el, name, cur == null ? '' : cur);
      }
    }
  }

  var style = {
    create: updateStyle,
    update: updateStyle
  };

  /*  */

  var whitespaceRE = /\s+/;

  /**
   * Add class with compatibility for SVG since classList is not supported on
   * SVG elements in IE
   */
  function addClass (el, cls) {
    /* istanbul ignore if */
    if (!cls || !(cls = cls.trim())) {
      return
    }

    /* istanbul ignore else */
    if (el.classList) {
      if (cls.indexOf(' ') > -1) {
        cls.split(whitespaceRE).forEach(function (c) { return el.classList.add(c); });
      } else {
        el.classList.add(cls);
      }
    } else {
      var cur = " " + (el.getAttribute('class') || '') + " ";
      if (cur.indexOf(' ' + cls + ' ') < 0) {
        el.setAttribute('class', (cur + cls).trim());
      }
    }
  }

  /**
   * Remove class with compatibility for SVG since classList is not supported on
   * SVG elements in IE
   */
  function removeClass (el, cls) {
    /* istanbul ignore if */
    if (!cls || !(cls = cls.trim())) {
      return
    }

    /* istanbul ignore else */
    if (el.classList) {
      if (cls.indexOf(' ') > -1) {
        cls.split(whitespaceRE).forEach(function (c) { return el.classList.remove(c); });
      } else {
        el.classList.remove(cls);
      }
      if (!el.classList.length) {
        el.removeAttribute('class');
      }
    } else {
      var cur = " " + (el.getAttribute('class') || '') + " ";
      var tar = ' ' + cls + ' ';
      while (cur.indexOf(tar) >= 0) {
        cur = cur.replace(tar, ' ');
      }
      cur = cur.trim();
      if (cur) {
        el.setAttribute('class', cur);
      } else {
        el.removeAttribute('class');
      }
    }
  }

  /*  */

  function resolveTransition (def) {
    if (!def) {
      return
    }
    /* istanbul ignore else */
    if (typeof def === 'object') {
      var res = {};
      if (def.css !== false) {
        extend(res, autoCssTransition(def.name || 'v'));
      }
      extend(res, def);
      return res
    } else if (typeof def === 'string') {
      return autoCssTransition(def)
    }
  }

  var autoCssTransition = cached(function (name) {
    return {
      enterClass: (name + "-enter"),
      enterToClass: (name + "-enter-to"),
      enterActiveClass: (name + "-enter-active"),
      leaveClass: (name + "-leave"),
      leaveToClass: (name + "-leave-to"),
      leaveActiveClass: (name + "-leave-active")
    }
  });

  var hasTransition = inBrowser && !isIE9;
  var TRANSITION = 'transition';
  var ANIMATION = 'animation';

  // Transition property/event sniffing
  var transitionProp = 'transition';
  var transitionEndEvent = 'transitionend';
  var animationProp = 'animation';
  var animationEndEvent = 'animationend';
  if (hasTransition) {
    /* istanbul ignore if */
    if (window.ontransitionend === undefined &&
      window.onwebkittransitionend !== undefined
    ) {
      transitionProp = 'WebkitTransition';
      transitionEndEvent = 'webkitTransitionEnd';
    }
    if (window.onanimationend === undefined &&
      window.onwebkitanimationend !== undefined
    ) {
      animationProp = 'WebkitAnimation';
      animationEndEvent = 'webkitAnimationEnd';
    }
  }

  // binding to window is necessary to make hot reload work in IE in strict mode
  var raf = inBrowser
    ? window.requestAnimationFrame
      ? window.requestAnimationFrame.bind(window)
      : setTimeout
    : /* istanbul ignore next */ function (fn) { return fn(); };

  function nextFrame (fn) {
    raf(function () {
      raf(fn);
    });
  }

  function addTransitionClass (el, cls) {
    var transitionClasses = el._transitionClasses || (el._transitionClasses = []);
    if (transitionClasses.indexOf(cls) < 0) {
      transitionClasses.push(cls);
      addClass(el, cls);
    }
  }

  function removeTransitionClass (el, cls) {
    if (el._transitionClasses) {
      remove(el._transitionClasses, cls);
    }
    removeClass(el, cls);
  }

  function whenTransitionEnds (
    el,
    expectedType,
    cb
  ) {
    var ref = getTransitionInfo(el, expectedType);
    var type = ref.type;
    var timeout = ref.timeout;
    var propCount = ref.propCount;
    if (!type) { return cb() }
    var event = type === TRANSITION ? transitionEndEvent : animationEndEvent;
    var ended = 0;
    var end = function () {
      el.removeEventListener(event, onEnd);
      cb();
    };
    var onEnd = function (e) {
      if (e.target === el) {
        if (++ended >= propCount) {
          end();
        }
      }
    };
    setTimeout(function () {
      if (ended < propCount) {
        end();
      }
    }, timeout + 1);
    el.addEventListener(event, onEnd);
  }

  var transformRE = /\b(transform|all)(,|$)/;

  function getTransitionInfo (el, expectedType) {
    var styles = window.getComputedStyle(el);
    // JSDOM may return undefined for transition properties
    var transitionDelays = (styles[transitionProp + 'Delay'] || '').split(', ');
    var transitionDurations = (styles[transitionProp + 'Duration'] || '').split(', ');
    var transitionTimeout = getTimeout(transitionDelays, transitionDurations);
    var animationDelays = (styles[animationProp + 'Delay'] || '').split(', ');
    var animationDurations = (styles[animationProp + 'Duration'] || '').split(', ');
    var animationTimeout = getTimeout(animationDelays, animationDurations);

    var type;
    var timeout = 0;
    var propCount = 0;
    /* istanbul ignore if */
    if (expectedType === TRANSITION) {
      if (transitionTimeout > 0) {
        type = TRANSITION;
        timeout = transitionTimeout;
        propCount = transitionDurations.length;
      }
    } else if (expectedType === ANIMATION) {
      if (animationTimeout > 0) {
        type = ANIMATION;
        timeout = animationTimeout;
        propCount = animationDurations.length;
      }
    } else {
      timeout = Math.max(transitionTimeout, animationTimeout);
      type = timeout > 0
        ? transitionTimeout > animationTimeout
          ? TRANSITION
          : ANIMATION
        : null;
      propCount = type
        ? type === TRANSITION
          ? transitionDurations.length
          : animationDurations.length
        : 0;
    }
    var hasTransform =
      type === TRANSITION &&
      transformRE.test(styles[transitionProp + 'Property']);
    return {
      type: type,
      timeout: timeout,
      propCount: propCount,
      hasTransform: hasTransform
    }
  }

  function getTimeout (delays, durations) {
    /* istanbul ignore next */
    while (delays.length < durations.length) {
      delays = delays.concat(delays);
    }

    return Math.max.apply(null, durations.map(function (d, i) {
      return toMs(d) + toMs(delays[i])
    }))
  }

  // Old versions of Chromium (below 61.0.3163.100) formats floating pointer numbers
  // in a locale-dependent way, using a comma instead of a dot.
  // If comma is not replaced with a dot, the input will be rounded down (i.e. acting
  // as a floor function) causing unexpected behaviors
  function toMs (s) {
    return Number(s.slice(0, -1).replace(',', '.')) * 1000
  }

  /*  */

  function enter (vnode, toggleDisplay) {
    var el = vnode.elm;

    // call leave callback now
    if (isDef(el._leaveCb)) {
      el._leaveCb.cancelled = true;
      el._leaveCb();
    }

    var data = resolveTransition(vnode.data.transition);
    if (isUndef(data)) {
      return
    }

    /* istanbul ignore if */
    if (isDef(el._enterCb) || el.nodeType !== 1) {
      return
    }

    var css = data.css;
    var type = data.type;
    var enterClass = data.enterClass;
    var enterToClass = data.enterToClass;
    var enterActiveClass = data.enterActiveClass;
    var appearClass = data.appearClass;
    var appearToClass = data.appearToClass;
    var appearActiveClass = data.appearActiveClass;
    var beforeEnter = data.beforeEnter;
    var enter = data.enter;
    var afterEnter = data.afterEnter;
    var enterCancelled = data.enterCancelled;
    var beforeAppear = data.beforeAppear;
    var appear = data.appear;
    var afterAppear = data.afterAppear;
    var appearCancelled = data.appearCancelled;
    var duration = data.duration;

    // activeInstance will always be the <transition> component managing this
    // transition. One edge case to check is when the <transition> is placed
    // as the root node of a child component. In that case we need to check
    // <transition>'s parent for appear check.
    var context = activeInstance;
    var transitionNode = activeInstance.$vnode;
    while (transitionNode && transitionNode.parent) {
      context = transitionNode.context;
      transitionNode = transitionNode.parent;
    }

    var isAppear = !context._isMounted || !vnode.isRootInsert;

    if (isAppear && !appear && appear !== '') {
      return
    }

    var startClass = isAppear && appearClass
      ? appearClass
      : enterClass;
    var activeClass = isAppear && appearActiveClass
      ? appearActiveClass
      : enterActiveClass;
    var toClass = isAppear && appearToClass
      ? appearToClass
      : enterToClass;

    var beforeEnterHook = isAppear
      ? (beforeAppear || beforeEnter)
      : beforeEnter;
    var enterHook = isAppear
      ? (typeof appear === 'function' ? appear : enter)
      : enter;
    var afterEnterHook = isAppear
      ? (afterAppear || afterEnter)
      : afterEnter;
    var enterCancelledHook = isAppear
      ? (appearCancelled || enterCancelled)
      : enterCancelled;

    var explicitEnterDuration = toNumber(
      isObject(duration)
        ? duration.enter
        : duration
    );

    if ( explicitEnterDuration != null) {
      checkDuration(explicitEnterDuration, 'enter', vnode);
    }

    var expectsCSS = css !== false && !isIE9;
    var userWantsControl = getHookArgumentsLength(enterHook);

    var cb = el._enterCb = once(function () {
      if (expectsCSS) {
        removeTransitionClass(el, toClass);
        removeTransitionClass(el, activeClass);
      }
      if (cb.cancelled) {
        if (expectsCSS) {
          removeTransitionClass(el, startClass);
        }
        enterCancelledHook && enterCancelledHook(el);
      } else {
        afterEnterHook && afterEnterHook(el);
      }
      el._enterCb = null;
    });

    if (!vnode.data.show) {
      // remove pending leave element on enter by injecting an insert hook
      mergeVNodeHook(vnode, 'insert', function () {
        var parent = el.parentNode;
        var pendingNode = parent && parent._pending && parent._pending[vnode.key];
        if (pendingNode &&
          pendingNode.tag === vnode.tag &&
          pendingNode.elm._leaveCb
        ) {
          pendingNode.elm._leaveCb();
        }
        enterHook && enterHook(el, cb);
      });
    }

    // start enter transition
    beforeEnterHook && beforeEnterHook(el);
    if (expectsCSS) {
      addTransitionClass(el, startClass);
      addTransitionClass(el, activeClass);
      nextFrame(function () {
        removeTransitionClass(el, startClass);
        if (!cb.cancelled) {
          addTransitionClass(el, toClass);
          if (!userWantsControl) {
            if (isValidDuration(explicitEnterDuration)) {
              setTimeout(cb, explicitEnterDuration);
            } else {
              whenTransitionEnds(el, type, cb);
            }
          }
        }
      });
    }

    if (vnode.data.show) {
      toggleDisplay && toggleDisplay();
      enterHook && enterHook(el, cb);
    }

    if (!expectsCSS && !userWantsControl) {
      cb();
    }
  }

  function leave (vnode, rm) {
    var el = vnode.elm;

    // call enter callback now
    if (isDef(el._enterCb)) {
      el._enterCb.cancelled = true;
      el._enterCb();
    }

    var data = resolveTransition(vnode.data.transition);
    if (isUndef(data) || el.nodeType !== 1) {
      return rm()
    }

    /* istanbul ignore if */
    if (isDef(el._leaveCb)) {
      return
    }

    var css = data.css;
    var type = data.type;
    var leaveClass = data.leaveClass;
    var leaveToClass = data.leaveToClass;
    var leaveActiveClass = data.leaveActiveClass;
    var beforeLeave = data.beforeLeave;
    var leave = data.leave;
    var afterLeave = data.afterLeave;
    var leaveCancelled = data.leaveCancelled;
    var delayLeave = data.delayLeave;
    var duration = data.duration;

    var expectsCSS = css !== false && !isIE9;
    var userWantsControl = getHookArgumentsLength(leave);

    var explicitLeaveDuration = toNumber(
      isObject(duration)
        ? duration.leave
        : duration
    );

    if ( isDef(explicitLeaveDuration)) {
      checkDuration(explicitLeaveDuration, 'leave', vnode);
    }

    var cb = el._leaveCb = once(function () {
      if (el.parentNode && el.parentNode._pending) {
        el.parentNode._pending[vnode.key] = null;
      }
      if (expectsCSS) {
        removeTransitionClass(el, leaveToClass);
        removeTransitionClass(el, leaveActiveClass);
      }
      if (cb.cancelled) {
        if (expectsCSS) {
          removeTransitionClass(el, leaveClass);
        }
        leaveCancelled && leaveCancelled(el);
      } else {
        rm();
        afterLeave && afterLeave(el);
      }
      el._leaveCb = null;
    });

    if (delayLeave) {
      delayLeave(performLeave);
    } else {
      performLeave();
    }

    function performLeave () {
      // the delayed leave may have already been cancelled
      if (cb.cancelled) {
        return
      }
      // record leaving element
      if (!vnode.data.show && el.parentNode) {
        (el.parentNode._pending || (el.parentNode._pending = {}))[(vnode.key)] = vnode;
      }
      beforeLeave && beforeLeave(el);
      if (expectsCSS) {
        addTransitionClass(el, leaveClass);
        addTransitionClass(el, leaveActiveClass);
        nextFrame(function () {
          removeTransitionClass(el, leaveClass);
          if (!cb.cancelled) {
            addTransitionClass(el, leaveToClass);
            if (!userWantsControl) {
              if (isValidDuration(explicitLeaveDuration)) {
                setTimeout(cb, explicitLeaveDuration);
              } else {
                whenTransitionEnds(el, type, cb);
              }
            }
          }
        });
      }
      leave && leave(el, cb);
      if (!expectsCSS && !userWantsControl) {
        cb();
      }
    }
  }

  // only used in dev mode
  function checkDuration (val, name, vnode) {
    if (typeof val !== 'number') {
      warn(
        "<transition> explicit " + name + " duration is not a valid number - " +
        "got " + (JSON.stringify(val)) + ".",
        vnode.context
      );
    } else if (isNaN(val)) {
      warn(
        "<transition> explicit " + name + " duration is NaN - " +
        'the duration expression might be incorrect.',
        vnode.context
      );
    }
  }

  function isValidDuration (val) {
    return typeof val === 'number' && !isNaN(val)
  }

  /**
   * Normalize a transition hook's argument length. The hook may be:
   * - a merged hook (invoker) with the original in .fns
   * - a wrapped component method (check ._length)
   * - a plain function (.length)
   */
  function getHookArgumentsLength (fn) {
    if (isUndef(fn)) {
      return false
    }
    var invokerFns = fn.fns;
    if (isDef(invokerFns)) {
      // invoker
      return getHookArgumentsLength(
        Array.isArray(invokerFns)
          ? invokerFns[0]
          : invokerFns
      )
    } else {
      return (fn._length || fn.length) > 1
    }
  }

  function _enter (_, vnode) {
    if (vnode.data.show !== true) {
      enter(vnode);
    }
  }

  var transition = inBrowser ? {
    create: _enter,
    activate: _enter,
    remove: function remove (vnode, rm) {
      /* istanbul ignore else */
      if (vnode.data.show !== true) {
        leave(vnode, rm);
      } else {
        rm();
      }
    }
  } : {};

  var platformModules = [
    attrs,
    klass,
    events,
    domProps,
    style,
    transition
  ];

  /*  */

  // the directive module should be applied last, after all
  // built-in modules have been applied.
  var modules = platformModules.concat(baseModules);

  // patch 工厂函数，为其传入平台持有的一些操作，然后返回一个 patch 函数
  var patch = createPatchFunction({ nodeOps: nodeOps, modules: modules });

  /**
   * Not type checking this file because flow doesn't like attaching
   * properties to Elements.
   */

  /* istanbul ignore if */
  if (isIE9) {
    // http://www.matts411.com/post/internet-explorer-9-oninput/
    document.addEventListener('selectionchange', function () {
      var el = document.activeElement;
      if (el && el.vmodel) {
        trigger(el, 'input');
      }
    });
  }

  var directive = {
    inserted: function inserted (el, binding, vnode, oldVnode) {
      if (vnode.tag === 'select') {
        // #6903
        if (oldVnode.elm && !oldVnode.elm._vOptions) {
          mergeVNodeHook(vnode, 'postpatch', function () {
            directive.componentUpdated(el, binding, vnode);
          });
        } else {
          setSelected(el, binding, vnode.context);
        }
        el._vOptions = [].map.call(el.options, getValue);
      } else if (vnode.tag === 'textarea' || isTextInputType(el.type)) {
        el._vModifiers = binding.modifiers;
        if (!binding.modifiers.lazy) {
          el.addEventListener('compositionstart', onCompositionStart);
          el.addEventListener('compositionend', onCompositionEnd);
          // Safari < 10.2 & UIWebView doesn't fire compositionend when
          // switching focus before confirming composition choice
          // this also fixes the issue where some browsers e.g. iOS Chrome
          // fires "change" instead of "input" on autocomplete.
          el.addEventListener('change', onCompositionEnd);
          /* istanbul ignore if */
          if (isIE9) {
            el.vmodel = true;
          }
        }
      }
    },

    componentUpdated: function componentUpdated (el, binding, vnode) {
      if (vnode.tag === 'select') {
        setSelected(el, binding, vnode.context);
        // in case the options rendered by v-for have changed,
        // it's possible that the value is out-of-sync with the rendered options.
        // detect such cases and filter out values that no longer has a matching
        // option in the DOM.
        var prevOptions = el._vOptions;
        var curOptions = el._vOptions = [].map.call(el.options, getValue);
        if (curOptions.some(function (o, i) { return !looseEqual(o, prevOptions[i]); })) {
          // trigger change event if
          // no matching option found for at least one value
          var needReset = el.multiple
            ? binding.value.some(function (v) { return hasNoMatchingOption(v, curOptions); })
            : binding.value !== binding.oldValue && hasNoMatchingOption(binding.value, curOptions);
          if (needReset) {
            trigger(el, 'change');
          }
        }
      }
    }
  };

  function setSelected (el, binding, vm) {
    actuallySetSelected(el, binding, vm);
    /* istanbul ignore if */
    if (isIE || isEdge) {
      setTimeout(function () {
        actuallySetSelected(el, binding, vm);
      }, 0);
    }
  }

  function actuallySetSelected (el, binding, vm) {
    var value = binding.value;
    var isMultiple = el.multiple;
    if (isMultiple && !Array.isArray(value)) {
       warn(
        "<select multiple v-model=\"" + (binding.expression) + "\"> " +
        "expects an Array value for its binding, but got " + (Object.prototype.toString.call(value).slice(8, -1)),
        vm
      );
      return
    }
    var selected, option;
    for (var i = 0, l = el.options.length; i < l; i++) {
      option = el.options[i];
      if (isMultiple) {
        selected = looseIndexOf(value, getValue(option)) > -1;
        if (option.selected !== selected) {
          option.selected = selected;
        }
      } else {
        if (looseEqual(getValue(option), value)) {
          if (el.selectedIndex !== i) {
            el.selectedIndex = i;
          }
          return
        }
      }
    }
    if (!isMultiple) {
      el.selectedIndex = -1;
    }
  }

  function hasNoMatchingOption (value, options) {
    return options.every(function (o) { return !looseEqual(o, value); })
  }

  function getValue (option) {
    return '_value' in option
      ? option._value
      : option.value
  }

  function onCompositionStart (e) {
    e.target.composing = true;
  }

  function onCompositionEnd (e) {
    // prevent triggering an input event for no reason
    if (!e.target.composing) { return }
    e.target.composing = false;
    trigger(e.target, 'input');
  }

  function trigger (el, type) {
    var e = document.createEvent('HTMLEvents');
    e.initEvent(type, true, true);
    el.dispatchEvent(e);
  }

  /*  */

  // recursively search for possible transition defined inside the component root
  function locateNode (vnode) {
    return vnode.componentInstance && (!vnode.data || !vnode.data.transition)
      ? locateNode(vnode.componentInstance._vnode)
      : vnode
  }

  var show = {
    bind: function bind (el, ref, vnode) {
      var value = ref.value;

      vnode = locateNode(vnode);
      var transition = vnode.data && vnode.data.transition;
      var originalDisplay = el.__vOriginalDisplay =
        el.style.display === 'none' ? '' : el.style.display;
      if (value && transition) {
        vnode.data.show = true;
        enter(vnode, function () {
          el.style.display = originalDisplay;
        });
      } else {
        el.style.display = value ? originalDisplay : 'none';
      }
    },

    update: function update (el, ref, vnode) {
      var value = ref.value;
      var oldValue = ref.oldValue;

      /* istanbul ignore if */
      if (!value === !oldValue) { return }
      vnode = locateNode(vnode);
      var transition = vnode.data && vnode.data.transition;
      if (transition) {
        vnode.data.show = true;
        if (value) {
          enter(vnode, function () {
            el.style.display = el.__vOriginalDisplay;
          });
        } else {
          leave(vnode, function () {
            el.style.display = 'none';
          });
        }
      } else {
        el.style.display = value ? el.__vOriginalDisplay : 'none';
      }
    },

    unbind: function unbind (
      el,
      binding,
      vnode,
      oldVnode,
      isDestroy
    ) {
      if (!isDestroy) {
        el.style.display = el.__vOriginalDisplay;
      }
    }
  };

  var platformDirectives = {
    model: directive,
    show: show
  };

  /*  */

  var transitionProps = {
    name: String,
    appear: Boolean,
    css: Boolean,
    mode: String,
    type: String,
    enterClass: String,
    leaveClass: String,
    enterToClass: String,
    leaveToClass: String,
    enterActiveClass: String,
    leaveActiveClass: String,
    appearClass: String,
    appearActiveClass: String,
    appearToClass: String,
    duration: [Number, String, Object]
  };

  // in case the child is also an abstract component, e.g. <keep-alive>
  // we want to recursively retrieve the real component to be rendered
  function getRealChild (vnode) {
    var compOptions = vnode && vnode.componentOptions;
    if (compOptions && compOptions.Ctor.options.abstract) {
      return getRealChild(getFirstComponentChild(compOptions.children))
    } else {
      return vnode
    }
  }

  function extractTransitionData (comp) {
    var data = {};
    var options = comp.$options;
    // props
    for (var key in options.propsData) {
      data[key] = comp[key];
    }
    // events.
    // extract listeners and pass them directly to the transition methods
    var listeners = options._parentListeners;
    for (var key$1 in listeners) {
      data[camelize(key$1)] = listeners[key$1];
    }
    return data
  }

  function placeholder (h, rawChild) {
    if (/\d-keep-alive$/.test(rawChild.tag)) {
      return h('keep-alive', {
        props: rawChild.componentOptions.propsData
      })
    }
  }

  function hasParentTransition (vnode) {
    while ((vnode = vnode.parent)) {
      if (vnode.data.transition) {
        return true
      }
    }
  }

  function isSameChild (child, oldChild) {
    return oldChild.key === child.key && oldChild.tag === child.tag
  }

  var isNotTextNode = function (c) { return c.tag || isAsyncPlaceholder(c); };

  var isVShowDirective = function (d) { return d.name === 'show'; };

  var Transition = {
    name: 'transition',
    props: transitionProps,
    abstract: true,

    render: function render (h) {
      var this$1 = this;

      var children = this.$slots.default;
      if (!children) {
        return
      }

      // filter out text nodes (possible whitespaces)
      children = children.filter(isNotTextNode);
      /* istanbul ignore if */
      if (!children.length) {
        return
      }

      // warn multiple elements
      if ( children.length > 1) {
        warn(
          '<transition> can only be used on a single element. Use ' +
          '<transition-group> for lists.',
          this.$parent
        );
      }

      var mode = this.mode;

      // warn invalid mode
      if (
        mode && mode !== 'in-out' && mode !== 'out-in'
      ) {
        warn(
          'invalid <transition> mode: ' + mode,
          this.$parent
        );
      }

      var rawChild = children[0];

      // if this is a component root node and the component's
      // parent container node also has transition, skip.
      if (hasParentTransition(this.$vnode)) {
        return rawChild
      }

      // apply transition data to child
      // use getRealChild() to ignore abstract components e.g. keep-alive
      var child = getRealChild(rawChild);
      /* istanbul ignore if */
      if (!child) {
        return rawChild
      }

      if (this._leaving) {
        return placeholder(h, rawChild)
      }

      // ensure a key that is unique to the vnode type and to this transition
      // component instance. This key will be used to remove pending leaving nodes
      // during entering.
      var id = "__transition-" + (this._uid) + "-";
      child.key = child.key == null
        ? child.isComment
          ? id + 'comment'
          : id + child.tag
        : isPrimitive(child.key)
          ? (String(child.key).indexOf(id) === 0 ? child.key : id + child.key)
          : child.key;

      var data = (child.data || (child.data = {})).transition = extractTransitionData(this);
      var oldRawChild = this._vnode;
      var oldChild = getRealChild(oldRawChild);

      // mark v-show
      // so that the transition module can hand over the control to the directive
      if (child.data.directives && child.data.directives.some(isVShowDirective)) {
        child.data.show = true;
      }

      if (
        oldChild &&
        oldChild.data &&
        !isSameChild(child, oldChild) &&
        !isAsyncPlaceholder(oldChild) &&
        // #6687 component root is a comment node
        !(oldChild.componentInstance && oldChild.componentInstance._vnode.isComment)
      ) {
        // replace old child transition data with fresh one
        // important for dynamic transitions!
        var oldData = oldChild.data.transition = extend({}, data);
        // handle transition mode
        if (mode === 'out-in') {
          // return placeholder node and queue update when leave finishes
          this._leaving = true;
          mergeVNodeHook(oldData, 'afterLeave', function () {
            this$1._leaving = false;
            this$1.$forceUpdate();
          });
          return placeholder(h, rawChild)
        } else if (mode === 'in-out') {
          if (isAsyncPlaceholder(child)) {
            return oldRawChild
          }
          var delayedLeave;
          var performLeave = function () { delayedLeave(); };
          mergeVNodeHook(data, 'afterEnter', performLeave);
          mergeVNodeHook(data, 'enterCancelled', performLeave);
          mergeVNodeHook(oldData, 'delayLeave', function (leave) { delayedLeave = leave; });
        }
      }

      return rawChild
    }
  };

  /*  */

  var props = extend({
    tag: String,
    moveClass: String
  }, transitionProps);

  delete props.mode;

  var TransitionGroup = {
    props: props,

    beforeMount: function beforeMount () {
      var this$1 = this;

      var update = this._update;
      this._update = function (vnode, hydrating) {
        var restoreActiveInstance = setActiveInstance(this$1);
        // force removing pass
        this$1.__patch__(
          this$1._vnode,
          this$1.kept,
          false, // hydrating
          true // removeOnly (!important, avoids unnecessary moves)
        );
        this$1._vnode = this$1.kept;
        restoreActiveInstance();
        update.call(this$1, vnode, hydrating);
      };
    },

    render: function render (h) {
      var tag = this.tag || this.$vnode.data.tag || 'span';
      var map = Object.create(null);
      var prevChildren = this.prevChildren = this.children;
      var rawChildren = this.$slots.default || [];
      var children = this.children = [];
      var transitionData = extractTransitionData(this);

      for (var i = 0; i < rawChildren.length; i++) {
        var c = rawChildren[i];
        if (c.tag) {
          if (c.key != null && String(c.key).indexOf('__vlist') !== 0) {
            children.push(c);
            map[c.key] = c
            ;(c.data || (c.data = {})).transition = transitionData;
          } else {
            var opts = c.componentOptions;
            var name = opts ? (opts.Ctor.options.name || opts.tag || '') : c.tag;
            warn(("<transition-group> children must be keyed: <" + name + ">"));
          }
        }
      }

      if (prevChildren) {
        var kept = [];
        var removed = [];
        for (var i$1 = 0; i$1 < prevChildren.length; i$1++) {
          var c$1 = prevChildren[i$1];
          c$1.data.transition = transitionData;
          c$1.data.pos = c$1.elm.getBoundingClientRect();
          if (map[c$1.key]) {
            kept.push(c$1);
          } else {
            removed.push(c$1);
          }
        }
        this.kept = h(tag, null, kept);
        this.removed = removed;
      }

      return h(tag, null, children)
    },

    updated: function updated () {
      var children = this.prevChildren;
      var moveClass = this.moveClass || ((this.name || 'v') + '-move');
      if (!children.length || !this.hasMove(children[0].elm, moveClass)) {
        return
      }

      // we divide the work into three loops to avoid mixing DOM reads and writes
      // in each iteration - which helps prevent layout thrashing.
      children.forEach(callPendingCbs);
      children.forEach(recordPosition);
      children.forEach(applyTranslation);

      // force reflow to put everything in position
      // assign to this to avoid being removed in tree-shaking
      // $flow-disable-line
      this._reflow = document.body.offsetHeight;

      children.forEach(function (c) {
        if (c.data.moved) {
          var el = c.elm;
          var s = el.style;
          addTransitionClass(el, moveClass);
          s.transform = s.WebkitTransform = s.transitionDuration = '';
          el.addEventListener(transitionEndEvent, el._moveCb = function cb (e) {
            if (e && e.target !== el) {
              return
            }
            if (!e || /transform$/.test(e.propertyName)) {
              el.removeEventListener(transitionEndEvent, cb);
              el._moveCb = null;
              removeTransitionClass(el, moveClass);
            }
          });
        }
      });
    },

    methods: {
      hasMove: function hasMove (el, moveClass) {
        /* istanbul ignore if */
        if (!hasTransition) {
          return false
        }
        /* istanbul ignore if */
        if (this._hasMove) {
          return this._hasMove
        }
        // Detect whether an element with the move class applied has
        // CSS transitions. Since the element may be inside an entering
        // transition at this very moment, we make a clone of it and remove
        // all other transition classes applied to ensure only the move class
        // is applied.
        var clone = el.cloneNode();
        if (el._transitionClasses) {
          el._transitionClasses.forEach(function (cls) { removeClass(clone, cls); });
        }
        addClass(clone, moveClass);
        clone.style.display = 'none';
        this.$el.appendChild(clone);
        var info = getTransitionInfo(clone);
        this.$el.removeChild(clone);
        return (this._hasMove = info.hasTransform)
      }
    }
  };

  function callPendingCbs (c) {
    /* istanbul ignore if */
    if (c.elm._moveCb) {
      c.elm._moveCb();
    }
    /* istanbul ignore if */
    if (c.elm._enterCb) {
      c.elm._enterCb();
    }
  }

  function recordPosition (c) {
    c.data.newPos = c.elm.getBoundingClientRect();
  }

  function applyTranslation (c) {
    var oldPos = c.data.pos;
    var newPos = c.data.newPos;
    var dx = oldPos.left - newPos.left;
    var dy = oldPos.top - newPos.top;
    if (dx || dy) {
      c.data.moved = true;
      var s = c.elm.style;
      s.transform = s.WebkitTransform = "translate(" + dx + "px," + dy + "px)";
      s.transitionDuration = '0s';
    }
  }

  var platformComponents = {
    Transition: Transition,
    TransitionGroup: TransitionGroup
  };

  /*  */

  // install platform specific utils
  Vue.config.mustUseProp = mustUseProp;
  Vue.config.isReservedTag = isReservedTag;
  Vue.config.isReservedAttr = isReservedAttr;
  Vue.config.getTagNamespace = getTagNamespace;
  Vue.config.isUnknownElement = isUnknownElement;

  // install platform runtime directives & components
  extend(Vue.options.directives, platformDirectives);
  extend(Vue.options.components, platformComponents);

  // install platform patch function
  Vue.prototype.__patch__ = inBrowser ? patch : noop;

  // public mount method
  Vue.prototype.$mount = function (
    el,
    hydrating
  ) {
    el = el && inBrowser ? query(el) : undefined;
    return mountComponent(this, el, hydrating)
  };

  // devtools global hook
  /* istanbul ignore next */
  if (inBrowser) {
    setTimeout(function () {
      if (config.devtools) {
        if (devtools) {
          devtools.emit('init', Vue);
        } else {
          console[console.info ? 'info' : 'log'](
            'Download the Vue Devtools extension for a better development experience:\n' +
            'https://github.com/vuejs/vue-devtools'
          );
        }
      }
      if (
        config.productionTip !== false &&
        typeof console !== 'undefined'
      ) {
        console[console.info ? 'info' : 'log'](
          "You are running Vue in development mode.\n" +
          "Make sure to turn on production mode when deploying for production.\n" +
          "See more tips at https://vuejs.org/guide/deployment.html"
        );
      }
    }, 0);
  }

  /*  */

  var defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;
  var regexEscapeRE = /[-.*+?^${}()|[\]\/\\]/g;

  var buildRegex = cached(function (delimiters) {
    var open = delimiters[0].replace(regexEscapeRE, '\\$&');
    var close = delimiters[1].replace(regexEscapeRE, '\\$&');
    return new RegExp(open + '((?:.|\\n)+?)' + close, 'g')
  });



  /**
   * HTML 解析器得到的文本内容 text 传给文本解析器 parseText 函数
   *   1：判断传入的文本是否包含变量
   *   2：构造 expression
   *   3：构造 tokens
  */
  function parseText (
    // 待解析的文本内容
    text,
    // 包裹变量的符号
    delimiters
  ) {
    // 没有传入 delimiters,则是用 {{ }} 检测;有则用传入的来检测,例如:传入 %,就是用 %name% 来包裹变量
    var tagRE = delimiters ? buildRegex(delimiters) : defaultTagRE;
    // 不包含直接返回
    if (!tagRE.test(text)) {
      return
    }
    var tokens = [];
    var rawTokens = [];
    var lastIndex = tagRE.lastIndex = 0;
    var match, index, tokenValue;
    // 开启循环
    /**
     * tagRE.exec("hello {{name}}，I am {{age}}")
     * 返回：["{{name}}", "name", index: 6, input: "hello {{name}}，I am {{age}}", groups: undefined]
     * 匹配上时: 
     *    第一个元素:字符串中第一个完整的带有包裹的变量
     *    第二个元素：第一个被包裹的变量名
     *    带三个元素：第一个变量在字符串中的起始位置
     *    
     * tagRE.exec("hello")
     * 返回：null
    */
    while ((match = tagRE.exec(text))) {
      index = match.index;
      // push text token
      if (index > lastIndex) {
        // 先把 '{{' 前面的文本放入 tokens
        rawTokens.push(tokenValue = text.slice(lastIndex, index));
        tokens.push(JSON.stringify(tokenValue));
      }
      // tag token
      // 取出 '{{ }}' 中间的变量 exp
      var exp = parseFilters(match[1].trim());
      // 把变量 exp 改成 _s(exp) 形式放入 tokens中
      tokens.push(("_s(" + exp + ")"));
      rawTokens.push({ '@binding': exp });
      // 设置 lastIndex 以保证下一轮循环时，从 '}}' 后面再开始匹配正则
      lastIndex = index + match[0].length;
    }
    // 当剩下的 text 不再被正则匹配上时，表示所有变量已经处理完毕
    // lastIndex < text.length: 表示最后一个变量后面还有文本
    // 将最后的文本放入 token
    if (lastIndex < text.length) {
      rawTokens.push(tokenValue = text.slice(lastIndex));
      tokens.push(JSON.stringify(tokenValue));
    }
    // 把数组 token 中所有元素用 '+' 拼接并抛出对象
    return {
      expression: tokens.join('+'),
      tokens: rawTokens
    }
  }

  /*  */

  // 处理元素上 动态和静态 class 属性，得到 staticClass 和 classBinding
  function transformNode (el, options) {
    var warn = options.warn || baseWarn;
    // 获取 class 属性
    var staticClass = getAndRemoveAttr(el, 'class');
    if ( staticClass) {
      var res = parseText(staticClass, options.delimiters);
      if (res) {
        //  <div class="{{ val }}"> ==>  <div :class="val">
        warn(
          "class=\"" + staticClass + "\": " +
          'Interpolation inside attributes has been removed. ' +
          'Use v-bind or the colon shorthand instead. For example, ' +
          'instead of <div class="{{ val }}">, use <div :class="val">.',
          el.rawAttrsMap['class']
        );
      }
    }
    // 静态的 class
    if (staticClass) {
      el.staticClass = JSON.stringify(staticClass);
    }
    // 获取动态绑定的 class 属性
    var classBinding = getBindingAttr(el, 'class', false /* getStatic */);
    // 处理动态的 class
    if (classBinding) {
      el.classBinding = classBinding;
    }
  }

  function genData (el) {
    var data = '';
    if (el.staticClass) {
      data += "staticClass:" + (el.staticClass) + ",";
    }
    if (el.classBinding) {
      data += "class:" + (el.classBinding) + ",";
    }
    return data
  }

  var klass$1 = {
    staticKeys: ['staticClass'],
    transformNode: transformNode,
    genData: genData
  };

  /*  */

  // 处理元素上的动态和静态的 style 属性，得到 staticStyle 和 styleBInding
  function transformNode$1 (el, options) {
    var warn = options.warn || baseWarn;
    var staticStyle = getAndRemoveAttr(el, 'style');
    if (staticStyle) {
      /* istanbul ignore if */
      {
        var res = parseText(staticStyle, options.delimiters);
        if (res) {
          warn(
            "style=\"" + staticStyle + "\": " +
            'Interpolation inside attributes has been removed. ' +
            'Use v-bind or the colon shorthand instead. For example, ' +
            'instead of <div style="{{ val }}">, use <div :style="val">.',
            el.rawAttrsMap['style']
          );
        }
      }
      el.staticStyle = JSON.stringify(parseStyleText(staticStyle));
    }

    // 获取动态绑定的 style 属性
    var styleBinding = getBindingAttr(el, 'style', false /* getStatic */);
    if (styleBinding) {
      el.styleBinding = styleBinding;
    }
  }

  function genData$1 (el) {
    var data = '';
    if (el.staticStyle) {
      data += "staticStyle:" + (el.staticStyle) + ",";
    }
    if (el.styleBinding) {
      data += "style:(" + (el.styleBinding) + "),";
    }
    return data
  }

  var style$1 = {
    staticKeys: ['staticStyle'],
    transformNode: transformNode$1,
    genData: genData$1
  };

  /*  */

  var decoder;

  var he = {
    decode: function decode (html) {
      decoder = decoder || document.createElement('div');
      decoder.innerHTML = html;
      return decoder.textContent
    }
  };

  /*  */

  var isUnaryTag = makeMap(
    'area,base,br,col,embed,frame,hr,img,input,isindex,keygen,' +
    'link,meta,param,source,track,wbr'
  );

  // Elements that you can, intentionally, leave open
  // (and which close themselves)
  var canBeLeftOpenTag = makeMap(
    'colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr,source'
  );

  // HTML5 tags https://html.spec.whatwg.org/multipage/indices.html#elements-3
  // Phrasing Content https://html.spec.whatwg.org/multipage/dom.html#phrasing-content
  var isNonPhrasingTag = makeMap(
    'address,article,aside,base,blockquote,body,caption,col,colgroup,dd,' +
    'details,dialog,div,dl,dt,fieldset,figcaption,figure,footer,form,' +
    'h1,h2,h3,h4,h5,h6,head,header,hgroup,hr,html,legend,li,menuitem,meta,' +
    'optgroup,option,param,rp,rt,source,style,summary,tbody,td,tfoot,th,thead,' +
    'title,tr,track'
  );

  /**
   * Not type-checking this file because it's mostly vendor code.
   */

  // Regular Expressions for parsing tags and attributes
  // 解析 标签属性
  var attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
  var dynamicArgAttribute = /^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+?\][^\s"'<>\/=]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
  // 开始标签
  var ncname = "[a-zA-Z_][\\-\\.0-9_a-zA-Z" + (unicodeRegExp.source) + "]*";
  var qnameCapture = "((?:" + ncname + "\\:)?" + ncname + ")";
  var startTagOpen = new RegExp(("^<" + qnameCapture));
  // 自闭合标签
  var startTagClose = /^\s*(\/?)>/;
  // 结束标签
  var endTag = new RegExp(("^<\\/" + qnameCapture + "[^>]*>"));
  // DOCTYPE
  var doctype = /^<!DOCTYPE [^>]+>/i;
  // #7298: escape - to avoid being passed as HTML comment when inlined in page
  // 注释 <!--< ![endif] -->
  var comment = /^<!\--/;
  // 条件注释 <!-- [if !IE]> -->
  var conditionalComment = /^<!\[/;

  // Special Elements (can contain anything)
  var isPlainTextElement = makeMap('script,style,textarea', true);
  var reCache = {};

  var decodingMap = {
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&amp;': '&',
    '&#10;': '\n',
    '&#9;': '\t',
    '&#39;': "'"
  };
  var encodedAttr = /&(?:lt|gt|quot|amp|#39);/g;
  var encodedAttrWithNewLines = /&(?:lt|gt|quot|amp|#39|#10|#9);/g;

  // #5992
  var isIgnoreNewlineTag = makeMap('pre,textarea', true);
  var shouldIgnoreFirstNewline = function (tag, html) { return tag && isIgnoreNewlineTag(tag) && html[0] === '\n'; };

  function decodeAttr (value, shouldDecodeNewlines) {
    var re = shouldDecodeNewlines ? encodedAttrWithNewLines : encodedAttr;
    return value.replace(re, function (match) { return decodingMap[match]; })
  }

  // 解析不同内容并调用对应的钩子函数生成对应的 AST 节点，最终完成整个模板字符串转化成 AST
  /**
   * @description: 通过循环遍历 html 模板字符串，依次处理其中的各个标签，以及标签上的属性
   * @param {*} html html模板
   * @param {*} options 配置项
   * @return {*}
   */
  function parseHTML (html, options) {
    var stack = [];
    var expectHTML = options.expectHTML;
    // 是否是自闭合标签
    var isUnaryTag = options.isUnaryTag || no;
    // 检测标签是否是可以省略闭合标签的非自闭合标签，即是否可以只有开始标签
    var canBeLeftOpenTag = options.canBeLeftOpenTag || no;
    // 解析游标，标记当前从何处解析，即记录当前在原始 html 字符串中开始的位置
    var index = 0;
    // last：存储剩余还未解析的模板字符串 lastTag：存储位于 stack 栈顶的元素
    var last, lastTag;
    // 开启 while 循环，解析 html
    while (html) {
      // 存储 html
      last = html;
      // Make sure we're not in a plaintext content element like script/style
      // !lastTag：当前 html 字符串没有父节点
      // 确保即将 parse 的内容不是在纯文本标签里 script、style、textarea
      if (!lastTag || !isPlainTextElement(lastTag)) {
        var textEnd = html.indexOf('<');
        /**
         * 字符串以 '<' 开头：
         *    开始标签：<div>
         *    结束标签：</div>
         *    注释：<!-- 我是注释 -->
         *    条件注释：<!-- [if !IE]> <![endif] -->
         *    DOCTYPE：<!DOCTYPE html>
         * 每处理完一种情况，就会截断循环（continue），并且重置 html 字符串
         * 将处理过的标签截掉，下一次循环处理剩余的 html 字符串模版
        */
        if (textEnd === 0) {
          // Comment:
          // 解析是否为注释
          if (comment.test(html)) {
            // 若为注释，则继续查找是否存在 '-->' 的结束索引
            var commentEnd = html.indexOf('-->');

            if (commentEnd >= 0) {
              // 若存在，继续判断 options 中是否保留注释
              if (options.shouldKeepComment) {
                // '<!--' 长度为 4，开始截取，直到 '-->'
                // 得到注释内容、注释的开始索引、结束索引
                options.comment(html.substring(4, commentEnd), index, index + commentEnd + 3);
              }
              // 将游标移动到 '-->' 之后，继续解析
              advance(commentEnd + 3);
              continue
            }
          }

          // http://en.wikipedia.org/wiki/Conditional_comment#Downlevel-revealed_conditional_comment
          // 解析是否为条件注释
          if (conditionalComment.test(html)) {
            // 继续查找是否存在 ']>' 结束位置
            var conditionalEnd = html.indexOf(']>');

            // 条件注释不存在于真正的 DOM 树
            if (conditionalEnd >= 0) {
              // 将原本的 html 字符串把条件注释截掉，剩下内容，继续匹配
              advance(conditionalEnd + 2);
              continue
            }
          }

          // Doctype:
          // 解析 DOCTYPE，同条件注释
          var doctypeMatch = html.match(doctype);
          if (doctypeMatch) {
            advance(doctypeMatch[0].length);
            continue
          }

          // 核心：
          
          /**
           * 处理开始标签和结束标签是整个函数的核心部分
           * 这两部分在构造 element ast
          */
          // End tag:
          // '</div>'.match(endTag)  // ["</div>", "div", index: 0, input: "</div>", groups: undefined]
          // '<div>'.match(endTag)  // null   
          var endTagMatch = html.match(endTag);
          if (endTagMatch) {
            var curIndex = index;
            advance(endTagMatch[0].length);
            // 处理结束标签
            parseEndTag(endTagMatch[1], curIndex, index);
            continue
          }

          // Start tag:
          // 处理开始标签
          var startTagMatch = parseStartTag();
          if (startTagMatch) {
            // 进一步解析，并调用 options.start 方法
            // 真正的解析工作都是在此方法中
            handleStartTag(startTagMatch);
            if (shouldIgnoreFirstNewline(startTagMatch.tagName, html)) {
              advance(1);
            }
            continue
          }
        }

        var text = (void 0), rest = (void 0), next = (void 0);
        /**
         * 走到这一步，说明虽然 html 中匹配到 < 但不属于上述几种情况，只是一段普通文本
        */
        // 文本
        if (textEnd >= 0) {
          // 1<2<3</div>
          // html 字符串不是以 '<' 开头，说明前面都是纯文本，直接截取
          // 截取 html 模板字符串中 textEnd 之后的内容 <2<3</div>
          rest = html.slice(textEnd);
          // 循环处理，找到上述几种情况的标签
          while (
            !endTag.test(rest) &&
            !startTagOpen.test(rest) &&
            !comment.test(rest) &&
            !conditionalComment.test(rest)
          ) {
            // < in plain text, be forgiving and treat it as text
            // 用 '<' 以后的内容 rest 匹配 endTag、startTagOpen、comment、conditionalComment
            // 都无法匹配，说明 '<' 是属于文本本身的内容
            // 继续在后面的内容中找 <
            next = rest.indexOf('<', 1);
            // 没有找到，表示后面也是文本，直接结束循环
            if (next < 0) { break }
            // 在后续的字符串中找到 < 的索引位置为 textEnd
            textEnd += next;
            // 截取之后继续下一轮的循环匹配
            rest = html.slice(textEnd);
          }
          // 遍历结束，两种情况： 
          //   1：< 之后都是纯文本
          //   2：找到有效标签，截取文本
          text = html.substring(0, textEnd);
        }

        // 整个模板字符串都没有 '<'，整个都是文本
        if (textEnd < 0) {
          text = html;
        }

        // 将文本内容从 html 模板字符串上截取
        if (text) {
          advance(text.length);
        }

        // 处理文本
        // 将截取出来的 text 转化成 textAST
        // 将该 ast 放到父元素中，即 currentParent.children 数组中
        if (options.chars && text) {
          options.chars(text, index - text.length, index);
        }
      } else {
        // 处理 script、style、textarea 标签的闭合标签
        var endTagLength = 0;
        // 开始标签小写形式
        var stackedTag = lastTag.toLowerCase();
        var reStackedTag = reCache[stackedTag] || (reCache[stackedTag] = new RegExp('([\\s\\S]*?)(</' + stackedTag + '[^>]*>)', 'i'));
        // 匹配并处理开始标签和结束之间的所有文本，例如： <script>xxxx</script>
        var rest$1 = html.replace(reStackedTag, function (all, text, endTag) {
          endTagLength = endTag.length;
          if (!isPlainTextElement(stackedTag) && stackedTag !== 'noscript') {
            text = text
              .replace(/<!\--([\s\S]*?)-->/g, '$1') // #7298
              .replace(/<!\[CDATA\[([\s\S]*?)]]>/g, '$1');
          }
          if (shouldIgnoreFirstNewline(stackedTag, text)) {
            text = text.slice(1);
          }
          if (options.chars) {
            options.chars(text);
          }
          return ''
        });
        index += html.length - rest$1.length;
        html = rest$1;
        parseEndTag(stackedTag, index - endTagLength, index);
      }

      // 如果处理之后，html 字符串没有变化，将整个字符串作为文本对待
      if (html === last) {
        // 解析文本
        options.chars && options.chars(html);
        if ( !stack.length && options.warn) {
          options.warn(("Mal-formatted tag at end of template: \"" + html + "\""), { start: index + html.length });
        }
        break
      }
    }

    // Clean up any remaining tags
    // 避免跳出 while 循环，执行其抛出警告并将标签闭合
    parseEndTag();

    /**
     * 重置 html，html = 索引 n 位置开始的向后的所有字符串
     * index 为 html 在原始模板字符串中的开始索引，也就是下次处理的字符串的开始位置
    */
    function advance (n) {
      // n：解析游标
      index += n;
      html = html.substring(n);
    }

    // 解析开始标签
    function parseStartTag () {
      var start = html.match(startTagOpen);
      // '<div></div>'.match(startTagOpen)  => ['<div', 'div', index: 0, input: '<div></div>']
      if (start) {
        // 处理结果
        var match = {
          // 标签名
          tagName: start[1],
          // 属性，占位符
          attrs: [],
          // 标签开始位置
          start: index
        };
        // 截取 html
        advance(start[0].length);
        var end, attr;
        // <div a=1 b=2 c=3></div>
        // 循环提取标签属性，从 <div 之后开始到 > 之前，匹配属性 attrs
        // 剩下字符串 不符合开始标签的结束特征，即不是以 '>' 或 '/>'（自闭合）；并且 符合属性标签的特征
        while (!(end = html.match(startTagClose)) && (attr = html.match(dynamicArgAttribute) || html.match(attribute))) {
          // <div id='app'></div> : attr =  [" id="app"", "id", "=", "app", undefined, undefined, index: 0, input: " id="app"></div>", groups: undefined]
          attr.start = index;
          advance(attr[0].length);
          attr.end = index;
          match.attrs.push(attr);
        }
        // '></div>'.match(startTagClose) // [">", "", index: 0, input: "></div>", groups: undefined]
        // '/>'.match(startTagClose) // ["/>", "/", index: 0, input: "/><div></div>", groups: undefined]
        if (end) {
          // 通过 end[1] 判断非自闭合为 ""，自闭合为 "/"
          match.unarySlash = end[1];
          advance(end[0].length);
          match.end = index;
          return match
        }
      }
    }

    // 处理 parseStartTag 的结果
    /**
     * 进一步处理 match 对象
     *   处理属性 attrs，不是闭合标签，则将标签信息放到 stack 数组，待将来处理到它的闭合标签时再将其弹出 stack，表示该标签处理完毕，这是该标签的所有信息都在 ast 对象上 
     *   调用 options.start 方法处理标签，并根据标签信息生成 ast
     *   以及处理开始标签上的属性和指令，最后将 ast 放入 stack 数组
    */
    function handleStartTag (match) {
      // 开始标签的标签名
      var tagName = match.tagName;
      // 是否为自闭合标签
      var unarySlash = match.unarySlash;

      if (expectHTML) {
        if (lastTag === 'p' && isNonPhrasingTag(tagName)) {
          parseEndTag(lastTag);
        }
        if (canBeLeftOpenTag(tagName) && lastTag === tagName) {
          parseEndTag(tagName);
        }
      }

      // 是否为自闭合标签 布尔值
      var unary = isUnaryTag(tagName) || !!unarySlash;

      // match.attrs 数组的长度
      var l = match.attrs.length;
      // 与 l 长度相等的数组
      var attrs = new Array(l);
      for (var i = 0; i < l; i++) {
        // const args = ["class="a"", "class", "=", "a", undefined, undefined, index: 0, input: "class="a" id="b"></div>", groups: undefined]
        var args = match.attrs[i];
        // 存储标签属性的属性值
        var value = args[3] || args[4] || args[5] || '';
        // 兼容性处理 对 a 标签属性的 href 属性值中的 换行符或制表符做兼容性处理
        var shouldDecodeNewlines = tagName === 'a' && args[1] === 'href'
          ? options.shouldDecodeNewlinesForHref
          : options.shouldDecodeNewlines;
        attrs[i] = {
          // 标签属性的属性名，如 class
          name: args[1],
          // 标签属性的属性值，如 class 对应的 a
          value: decodeAttr(value, shouldDecodeNewlines)
        };
        // 非生产环境，记录属性的开始和结束索引
        if ( options.outputSourceRange) {
          attrs[i].start = args.start + args[0].match(/^\s*/).length;
          attrs[i].end = args.end;
        }
      }

      // 非自闭合，推入 stack 数组栈中，待将来处理到它额闭合标签时再将其弹出
      // 自闭合标签，则没必要进入 stack；直接处理众多属性，将他们都设置到 ast 对象上；没有结束标签的那一步
      if (!unary) {
        stack.push({ tag: tagName, lowerCasedTag: tagName.toLowerCase(), attrs: attrs, start: match.start, end: match.end });
        // 表示当前标签的结束标签为 tagName
        lastTag = tagName;
      }

      // 调用 start 钩子函数
      /**
       * stat 方法，6件事
       * 1：创建 AST 对象
       * 2：处理存在 v-model 指令的 input 标签，分别处理 input 为checkbox、radio、其他情况
       * 3：处理标签上众多指令，如：v-pre、v-for、v-if、v-once
       * 4：如果根节点 root 不存在则设置当前元素为根节点
       * 5：如果当前元素为非闭合标签，则将自己 push 到 stack 数组，并记录 currentParent，在接下来处理子元素时用来告诉子元素自己的父节点是谁
       * 6：如果当前元素为闭合标签，则表示改标签要处理结束了，让自己和父元素产生关系，以及设置自己的子元素
      */
      if (options.start) {
        options.start(tagName, attrs, unary, match.start, match.end);
      }
    }

    /**
     * @description: 解析结束标签
     *                  1：处理 stack 数组，从 stack 数组中找到当前结束标签对应的开始标签，然后调用 options.end 方法
     *                  2：处理完结束标签之后调整 stack 数组
     *                  3：处理异常情况
     * @param {*} tagName 标签名
     * @param {*} start 结束标签开始的索引 
     * @param {*} end 结束标签结束的索引
     */
    function parseEndTag (tagName, start, end) {
      var pos, lowerCasedTagName;
      if (start == null) { start = index; }
      if (end == null) { end = index; }

      // Find the closest opened tag of the same type
      if (tagName) {
        lowerCasedTagName = tagName.toLowerCase();
        // 从后往前遍历，在栈中寻找相同的标签并记录所在的位置
        // 理论上不出异常，stack 数组中的最后一个元素就是当前结束标签的开始标签的描述对象
        for (pos = stack.length - 1; pos >= 0; pos--) {
          if (stack[pos].lowerCasedTag === lowerCasedTagName) {
            break
          }
        }
      } else {
        // If no tag name is provided, clean shop
        pos = 0;
      }

      //  >= 0 说明找到相同的标签名
      if (pos >= 0) {
        // Close all the open elements, up the stack
        for (var i = stack.length - 1; i >= pos; i--) {
          // 缺少闭合标签  pos 应该是栈顶位置，后面不应该有元素
          if (
            (i > pos || !tagName) &&
            options.warn
          ) {
            options.warn(
              ("tag <" + (stack[i].tag) + "> has no matching end tag."),
              { start: stack[i].start, end: stack[i].end }
            );
          }
          if (options.end) {
            // 将其闭合，为保证解析结果的准确性
            options.end(stack[i].tag, start, end);
          }
        }

        // Remove the open elements from the stack
        // pos 位置以后的元素从 stack 栈中弹出，将刚才处理的那些标签从数组中移除，保证数组的最后一个元素就是下一个结束标签对应的开始标签
        stack.length = pos;
        // 把 lastTag 更新为栈顶元素，即记录 stack 数组中未处理的最后一个开始标签
        lastTag = pos && stack[pos - 1].tag;
      } else if (lowerCasedTagName === 'br') {
        // 如果没找到对应开始的标签；单独处理 br 和 p 标签
        // </br> 浏览器解析为正常的 <br> 标签 
        // </p> 浏览器会自动补全
        if (options.start) {
          // 创建 <br> AST 节点
          options.start(tagName, [], true, start, end);
        }
      } else if (lowerCasedTagName === 'p') {
        if (options.start) {
          // 补全 p 标签并创建 AST 节点 
          options.start(tagName, [], false, start, end);
        }
        if (options.end) {
          options.end(tagName, start, end);
        }
      }
    }
  }

  /*  */

  var onRE = /^@|^v-on:/;
  var dirRE =  /^v-|^@|^:|^#/;
  var forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/;
  var forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/;
  var stripParensRE = /^\(|\)$/g;
  var dynamicArgRE = /^\[.*\]$/;

  var argRE = /:(.*)$/;
  var bindRE = /^:|^\.|^v-bind:/;
  var modifierRE = /\.[^.\]]+(?=[^\]]*$)/g;

  var slotRE = /^v-slot(:|$)|^#/;

  var lineBreakRE = /[\r\n]/;
  var whitespaceRE$1 = /[ \f\t\r\n]+/g;

  var invalidAttributeRE = /[\s"'<>\/=]/;

  var decodeHTMLCached = cached(he.decode);

  var emptySlotScopeToken = "_empty_";

  // configurable state
  var warn$2;
  var delimiters;
  var transforms;
  var preTransforms;
  var postTransforms;
  var platformIsPreTag;
  var platformMustUseProp;
  var platformGetTagNamespace;
  var maybeComponent;

  function createASTElement (
    // 标签名
    tag,
    // 属性数组
    attrs,
    // 父元素
    parent
  ) {
    return {
      // 节点类型  元素节点
      type: 1,
      tag: tag, 
      // 属性数组  [{name, value, start, end }]
      attrsList: attrs,
      // { name: value }
      attrsMap: makeAttrsMap(attrs),
      rawAttrsMap: {},
      // 标记父元素
      parent: parent,
      // 存放所有子元素
      children: []
    }
  }

  /**
   * Convert HTML string to AST.
   * 将 HTML 字符串转换成 AST
   */
  function parse (
    // HTML 模板
    template,
    // 编译选项
    options
  ) {
    // 日志
    warn$2 = options.warn || baseWarn;

    // 是否为 pro 标签
    platformIsPreTag = options.isPreTag || no;
    // 必须使用 prop 进行绑定的属性
    platformMustUseProp = options.mustUseProp || no;
    // 获取标签的命名空间
    platformGetTagNamespace = options.getTagNamespace || no;
    // 是否是保留标签（html + svg）
    var isReservedTag = options.isReservedTag || no;
    // 判断一个元素是否为一个组件
    maybeComponent = function (el) { return !!(
      el.component ||
      el.attrsMap[':is'] ||
      el.attrsMap['v-bind:is'] ||
      !(el.attrsMap.is ? isReservedTag(el.attrsMap.is) : isReservedTag(el.tag))
    ); };
    // 三个数组，数组中每个元素都是一个函数，这些函数分别是 style、class、model 这三个模块中导出的对应函数
    transforms = pluckModuleFunction(options.modules, 'transformNode');
    preTransforms = pluckModuleFunction(options.modules, 'preTransformNode');
    postTransforms = pluckModuleFunction(options.modules, 'postTransformNode');

    // 界定符: 比如： {{}}
    delimiters = options.delimiters;

    /**
     * 定义一个栈：
     *    用于维护 AST 节点层级
     *    监测字符串模板中是否有未正确闭合的标签
    */
    // 解析的中间结果都放在这里
    var stack = [];
    // 空格选项
    var preserveWhitespace = options.preserveWhitespace !== false;
    var whitespaceOption = options.whitespace;
    // 根节点，以 root 为根，处理后的节点都会按照层级挂载到 root 下，最后 return 的就是 root，一个 ast 语法树
    var root;
    // 记录当前元素的父元素
    var currentParent;
    var inVPre = false;
    var inPre = false;
    var warned = false;

    function warnOnce (msg, range) {
      if (!warned) {
        warned = true;
        warn$2(msg, range);
      }
    }

    function closeElement (element) {
      // 清空节点末尾的空白字符
      trimEndingWhitespace(element);
      if (!inVPre && !element.processed) {
        element = processElement(element, options);
      }
      // tree management
      // 如果根节点存在 v-if 指令，则必须提供具有 v-else-if 或 v-else 的同级别节点
      if (!stack.length && element !== root) {
        // allow root elements with v-if, v-else-if and v-else
        if (root.if && (element.elseif || element.else)) {
          {
            checkRootConstraints(element);
          }
          addIfCondition(root, {
            exp: element.elseif,
            block: element
          });
        } else {
          warnOnce(
            "Component template should contain exactly one root element. " +
            "If you are using v-if on multiple elements, " +
            "use v-else-if to chain them instead.",
            { start: element.start }
          );
        }
      }
      // 将自己放到父元素的 children 数组中，设置自己的 parent 属性为 currentParent
      if (currentParent && !element.forbidden) {
        if (element.elseif || element.else) {
          processIfConditions(element, currentParent);
        } else {
          if (element.slotScope) {
            // scoped slot
            // keep it in the children list so that v-else(-if) conditions can
            // find it as the prev node.
            var name = element.slotTarget || '"default"'
            ;(currentParent.scopedSlots || (currentParent.scopedSlots = {}))[name] = element;
          }
          currentParent.children.push(element);
          element.parent = currentParent;
        }
      }

      // final children cleanup
      // filter out scoped slots
      // 将自己所有非插槽的子元素设置到 element.children 数组中
      element.children = element.children.filter(function (c) { return !(c).slotScope; });
      // remove trailing whitespace node again
      trimEndingWhitespace(element);

      // check pre state
      if (element.pre) {
        inVPre = false;
      }
      if (platformIsPreTag(element.tag)) {
        inPre = false;
      }
      // apply post-transforms
      for (var i = 0; i < postTransforms.length; i++) {
        postTransforms[i](element, options);
      }
    }

    // 删除元素中空白的文本节点 比如：<div> </div>，删除 div 元素中的空白节点，将其从元素的 children 属性中移出去
    function trimEndingWhitespace (el) {
      // remove trailing whitespace node
      if (!inPre) {
        var lastNode;
        while (
          (lastNode = el.children[el.children.length - 1]) &&
          // 静态文本节点
          lastNode.type === 3 &&
          lastNode.text === ' '
        ) {
          el.children.pop();
        }
      }
    }

    // 检查根元素
    //  不能使用 slot 和 template 标签作为根元素
    //  不能在根元素上使用 v-for 指令
    function checkRootConstraints (el) {
      if (el.tag === 'slot' || el.tag === 'template') {
        warnOnce(
          "Cannot use <" + (el.tag) + "> as component root element because it may " +
          'contain multiple nodes.',
          { start: el.start }
        );
      }
      if (el.attrsMap.hasOwnProperty('v-for')) {
        warnOnce(
          'Cannot use v-for on stateful component root element because ' +
          'it renders multiple elements.',
          el.rawAttrsMap['v-for']
        );
      }
    }

    // 解析 html 模板字符串，处理所有标签以及标签上的属性
    parseHTML(template, {
      warn: warn$2,
      expectHTML: options.expectHTML,
      isUnaryTag: options.isUnaryTag,
      canBeLeftOpenTag: options.canBeLeftOpenTag,
      shouldDecodeNewlines: options.shouldDecodeNewlines,
      shouldDecodeNewlinesForHref: options.shouldDecodeNewlinesForHref,
      shouldKeepComment: options.comments,
      outputSourceRange: options.outputSourceRange,
      /**
       * type: 1  元素节点
       * type：2  包含变量的动态文本节点
       * type：3  不包含变量的纯文本节点
      */
      // 解析到开始标签时,调用该函数
      /**
       * @description: 
       * @param {*} tag 标签名
       * @param {*} attrs 标签属性；
       * @param {*} unary 自闭合标签
       * @param {*} start 标签在 html 字符串中的开始索引
       * @param {*} end  标签在 html 字符串中的结束索引
       */
      start: function start (tag, attrs, unary, start$1, end) {
        // check namespace.
        // inherit parent ns if there is one
        // 检查命名空间，如果存在，则继承父命名空间
        var ns = (currentParent && currentParent.ns) || platformGetTagNamespace(tag);

        // handle IE svg bug
        /* istanbul ignore if */
        if (isIE && ns === 'svg') {
          attrs = guardIESVGBug(attrs);
        }

        // 创建当前标签的 AST 对象
        var element = createASTElement(tag, attrs, currentParent);
        // 设置命名空间
        if (ns) {
          element.ns = ns;
        }

        // 在 ast 对象上添加一些属性，比如 start、end
        {
          if (options.outputSourceRange) {
            element.start = start$1;
            element.end = end;
            // 将属性数组解析成 对象
            element.rawAttrsMap = element.attrsList.reduce(function (cumulated, attr) {
              cumulated[attr.name] = attr;
              return cumulated
            }, {});
          }
          // 验证属性是否有效
          attrs.forEach(function (attr) {
            if (invalidAttributeRE.test(attr.name)) {
              warn$2(
                "Invalid dynamic argument expression: attribute names cannot contain " +
                "spaces, quotes, <, >, / or =.",
                {
                  start: attr.start + attr.name.indexOf("["),
                  end: attr.start + attr.name.length
                }
              );
            }
          });
        }

        // 非服务端渲染的情况下，模板中不应该出现 style、script 标签
        if (isForbiddenTag(element) && !isServerRendering()) {
          element.forbidden = true;
           warn$2(
            'Templates should only be responsible for mapping the state to the ' +
            'UI. Avoid placing tags with side-effects in your templates, such as ' +
            "<" + tag + ">" + ', as they will not be parsed.',
            { start: element.start }
          );
        }

        // apply pre-transforms
        /**
         * 为 element 对象分别执行 class、style、model 模块中的 preTransforms 方法
         * web 平台只有 model 模块有 preTransforms 方法
         * 用来处理存在 v-model 的 input 标签，处理标签上的众多属性，比如 v-for、v-if、:type、其他指令、属性等，最后将结果记录在 el 对象上
        */
        for (var i = 0; i < preTransforms.length; i++) {
          element = preTransforms[i](element, options) || element;
        }

        if (!inVPre) {
          // 如果存在 v-pre 指令，则设置 element.pre = true
          processPre(element);
          if (element.pre) {
            inVPre = true;
          }
        }
        // 如果 pre 标签，则设置 inPre 为 true
        if (platformIsPreTag(element.tag)) {
          inPre = true;
        }
        if (inVPre) {
          // 标签存在 v-pre 指令，只会渲染一次，将节点上的属性都设置到 el.attrs 数组对象中，作为静态属性，数组更新时不会渲染这部分内容
          processRawAttrs(element);
        } else if (!element.processed) {
          // structural directives
          // 处理 v-for 属性，得到 element.for = 可迭代对象 element.alias = 别名
          processFor(element);
          // 处理 v-if v-else-if v-else
          // v-if 属性会额外在 element.ifCondition 数组中添加 { exp，block } 对象
          processIf(element);
          // 处理 v-once 指令
          processOnce(element);
        }

        // 如果 root 不存在，则表示当前处理的元素为第一个元素，即组件的 根元素
        if (!root) {
          root = element;
          {
            // 检查根元素，对根元素有一些限制，比如：不能使用 slot 和 template 作为根元素，也不能在有状态组件的根元素上使用 v-for 指令
            checkRootConstraints(root);
          }
        }

        if (!unary) {
          // 非自闭合标签，通过 currentParent 记录当前元素，下一个元素处理的时候，就知道自己的父元素
          currentParent = element;
          // 将 element push 到 stack 数组，将来处理到当前元素的闭合标签时再拿出来
          // 调用 option.start 方法时,push 操作,进来的时候当前标签的一个基本配置信息
          stack.push(element);
        } else {
          // 
          closeElement(element);
        }
      },

      // 解析到结束标签时,调用该函数
      end: function end (tag, start, end$1) {
        var element = stack[stack.length - 1];
        // pop stack
        stack.length -= 1;
        currentParent = stack[stack.length - 1];
        if ( options.outputSourceRange) {
          element.end = end$1;
        }
        closeElement(element);
      },

      // 解析到文本时
      chars: function chars (text, start, end) {
        if (!currentParent) {
          {
            if (text === template) {
              warnOnce(
                'Component template requires a root element, rather than just text.',
                { start: start }
              );
            } else if ((text = text.trim())) {
              warnOnce(
                ("text \"" + text + "\" outside root element will be ignored."),
                { start: start }
              );
            }
          }
          return
        }
        // IE textarea placeholder bug
        /* istanbul ignore if */
        if (isIE &&
          currentParent.tag === 'textarea' &&
          currentParent.attrsMap.placeholder === text
        ) {
          return
        }
        var children = currentParent.children;
        if (inPre || text.trim()) {
          text = isTextTag(currentParent) ? text : decodeHTMLCached(text);
        } else if (!children.length) {
          // remove the whitespace-only node right after an opening tag
          text = '';
        } else if (whitespaceOption) {
          if (whitespaceOption === 'condense') {
            // in condense mode, remove the whitespace node if it contains
            // line break, otherwise condense to a single space
            text = lineBreakRE.test(text) ? '' : ' ';
          } else {
            text = ' ';
          }
        } else {
          text = preserveWhitespace ? ' ' : '';
        }
        if (text) {
          if (!inPre && whitespaceOption === 'condense') {
            // condense consecutive whitespaces into single space
            text = text.replace(whitespaceRE$1, ' ');
          }
          var res;
          var child;
          if (!inVPre && text !== ' ' && (res = parseText(text, delimiters))) {
            child = {
              type: 2,
              expression: res.expression,
              tokens: res.tokens,
              text: text
            };
          } else if (text !== ' ' || !children.length || children[children.length - 1].text !== ' ') {
            child = {
              type: 3,
              text: text
            };
          }
          if (child) {
            if ( options.outputSourceRange) {
              child.start = start;
              child.end = end;
            }
            children.push(child);
          }
        }
      },

      // 解析到注释时
      comment: function comment (text, start, end) {
        // adding anything as a sibling to the root node is forbidden
        // comments should still be allowed, but ignored
        // 禁止将任何内容作为 root 节点的同级,注释应该被允许,但是忽略
        // 不存在 currentParent,则是同级
        if (currentParent) {
          // 注释节点的 ast
          var child = {
            type: 3,
            text: text,
            isComment: true
          };
          if ( options.outputSourceRange) {
            child.start = start;
            child.end = end;
          }
          // 将当前注释节点放到父元素的 children 属性中
          currentParent.children.push(child);
        }
      }
    });
    // 返回生成的 ast 对象
    return root
  }

  // 处理 v-pre 指令
  function processPre (el) {
    if (getAndRemoveAttr(el, 'v-pre') != null) {
      el.pre = true;
    }
  }

  // 处理 el.attrs 数组对象
  function processRawAttrs (el) {
    var list = el.attrsList;
    var len = list.length;
    if (len) {
      var attrs = el.attrs = new Array(len);
      for (var i = 0; i < len; i++) {
        attrs[i] = {
          name: list[i].name,
          value: JSON.stringify(list[i].value)
        };
        if (list[i].start != null) {
          attrs[i].start = list[i].start;
          attrs[i].end = list[i].end;
        }
      }
    } else if (!el.pre) {
      // non root node in pre blocks with no attributes
      el.plain = true;
    }
  }

  // 分别处理元素节点的 key、ref、插槽、自闭合的 slot 标签、动态组件、class、style、v-bind、v-on、其他指令和属性
  function processElement (
    element,
    options
  ) {
    // el.key = val
    processKey(element);

    // determine whether this is a plain element after
    // removing structural attributes
    // 确定 element 是否为一个普通元素
    element.plain = (
      !element.key &&
      !element.scopedSlots &&
      !element.attrsList.length
    );

    // el.ref = val, el.refInFor = boolean
    processRef(element);
    // 处理插槽
    processSlotContent(element);
    // 处理 slot 标签
    processSlotOutlet(element);
    // 动态组件
    processComponent(element);
    // 分别为 element 执行 class、style 这两个模块中的 transformNode 方法
    for (var i = 0; i < transforms.length; i++) {
      element = transforms[i](element, options) || element;
    }
    // 处理标签上的属性、事件、指令、其他属性
    processAttrs(element);
    return element
  }

  // 处理 key，得到 el.key = exp
  function processKey (el) {
    var exp = getBindingAttr(el, 'key');
    if (exp) {
      // 异常处理
      {
        // template 标签不允许设置 key
        if (el.tag === 'template') {
          warn$2(
            "<template> cannot be keyed. Place the key on real elements instead.",
            getRawBindingAttr(el, 'key')
          );
        }
        if (el.for) {
          var iterator = el.iterator2 || el.iterator1;
          var parent = el.parent;
          if (iterator && iterator === exp && parent && parent.tag === 'transition-group') {
            warn$2(
              "Do not use v-for index as key on <transition-group> children, " +
              "this is the same as not using keys.",
              getRawBindingAttr(el, 'key'),
              true /* tip */
            );
          }
        }
      }
      el.key = exp;
    }
  }

  // 处理 ref 属性，得到 el.ref = val
  // 如果带有 ref 属性标签被包裹在含有 v-for 指令元素内部，标记 el.reInFor = true
  function processRef (el) {
    var ref = getBindingAttr(el, 'ref');
    if (ref) {
      el.ref = ref;
      // 判断包含 ref 属性的元素是否包含在具有 v-for 指令的元素内或后代元素中
      // 如果是，则 ref 指向的则是包含 DOM 节点或组件实例的数组
      el.refInFor = checkInFor(el);
    }
  }

  // 处理 v-for
  function processFor (el) {
    var exp;
    if ((exp = getAndRemoveAttr(el, 'v-for'))) {
      // 解析 v-for 的表达式，得到 { for： 可迭代对象，alias： 别名 }
      var res = parseFor(exp);
      if (res) {
        // 将 res 对象上的属性拷贝到 el 对象上
        extend(el, res);
      } else {
        warn$2(
          ("Invalid v-for expression: " + exp),
          el.rawAttrsMap['v-for']
        );
      }
    }
  }



  // 解析 v-for 指令的表达式，得到 res = { for: iterator, alias ： 别名}
  function parseFor (exp) {
    var inMatch = exp.match(forAliasRE);
    if (!inMatch) { return }
    var res = {};
    // for = '迭代对象'
    res.for = inMatch[2].trim();
    // 别名
    var alias = inMatch[1].trim().replace(stripParensRE, '');
    var iteratorMatch = alias.match(forIteratorRE);
    if (iteratorMatch) {
      res.alias = alias.replace(forIteratorRE, '').trim();
      res.iterator1 = iteratorMatch[1].trim();
      if (iteratorMatch[2]) {
        res.iterator2 = iteratorMatch[2].trim();
      }
    } else {
      res.alias = alias;
    }
    return res
  }

  function processIf (el) {
    // 获取 v-if 属性的值
    var exp = getAndRemoveAttr(el, 'v-if');
    if (exp) {
      el.if = exp;
      addIfCondition(el, {
        exp: exp,
        block: el
      });
    } else {
      if (getAndRemoveAttr(el, 'v-else') != null) {
        el.else = true;
      }
      var elseif = getAndRemoveAttr(el, 'v-else-if');
      if (elseif) {
        el.elseif = elseif;
      }
    }
  }

  function processIfConditions (el, parent) {
    // 查找到 parent.children 中的最后一个元素节点
    var prev = findPrevElement(parent.children);
    if (prev && prev.if) {
      addIfCondition(prev, {
        exp: el.elseif,
        block: el
      });
    } else {
      warn$2(
        "v-" + (el.elseif ? ('else-if="' + el.elseif + '"') : 'else') + " " +
        "used on element <" + (el.tag) + "> without corresponding v-if.",
        el.rawAttrsMap[el.elseif ? 'v-else-if' : 'v-else']
      );
    }
  }

  function findPrevElement (children) {
    var i = children.length;
    while (i--) {
      if (children[i].type === 1) {
        return children[i]
      } else {
        if ( children[i].text !== ' ') {
          warn$2(
            "text \"" + (children[i].text.trim()) + "\" between v-if and v-else(-if) " +
            "will be ignored.",
            children[i]
          );
        }
        children.pop();
      }
    }
  }

  // 将传递进来的条件对象放进 el.ifConditions 数组中
  function addIfCondition (el, condition) {
    if (!el.ifConditions) {
      el.ifConditions = [];
    }
    el.ifConditions.push(condition);
  }

  // 处理 v-once 
  function processOnce (el) {
    var once = getAndRemoveAttr(el, 'v-once');
    if (once != null) {
      el.once = true;
    }
  }

  // handle content being passed to a component as slot,
  // e.g. <template slot="xxx">, <div slot-scope="xxx">
  // 处理插槽
  function processSlotContent (el) {
    var slotScope;
    if (el.tag === 'template') {
      // template 标签上使用 scope 属性提示
      // scope 已弃用,2.5 之后使用 slot-scope 代替
      slotScope = getAndRemoveAttr(el, 'scope');
      /* istanbul ignore if */
      if ( slotScope) {
        warn$2(
          "the \"scope\" attribute for scoped slots have been deprecated and " +
          "replaced by \"slot-scope\" since 2.5. The new \"slot-scope\" attribute " +
          "can also be used on plain elements in addition to <template> to " +
          "denote scoped slots.",
          el.rawAttrsMap['scope'],
          true
        );
      }
      // el.slotScope = val
      el.slotScope = slotScope || getAndRemoveAttr(el, 'slot-scope');
    } else if ((slotScope = getAndRemoveAttr(el, 'slot-scope'))) {
      /* istanbul ignore if */
      // 元素不能同时使用 slot-scope 和 v-for， v-for 具有跟高的优先级
      if ( el.attrsMap['v-for']) {
        warn$2(
          "Ambiguous combined usage of slot-scope and v-for on <" + (el.tag) + "> " +
          "(v-for takes higher priority). Use a wrapper <template> for the " +
          "scoped slot to make it clearer.",
          el.rawAttrsMap['slot-scope'],
          true
        );
      }
      el.slotScope = slotScope;
    }

    // slot="xxx"
    var slotTarget = getBindingAttr(el, 'slot');
    if (slotTarget) {
      // el.slotTarget = 插槽名（具名插槽）
      el.slotTarget = slotTarget === '""' ? '"default"' : slotTarget;
      // 动态插槽名
      el.slotTargetDynamic = !!(el.attrsMap[':slot'] || el.attrsMap['v-bind:slot']);
      // preserve slot as an attribute for native shadow DOM compat
      // only for non-scoped slots.
      if (el.tag !== 'template' && !el.slotScope) {
        addAttr(el, 'slot', slotTarget, getRawBindingAttr(el, 'slot'));
      }
    }

    // 2.6 v-slot syntax
    {
      if (el.tag === 'template') {
        // v-slot on <template>
        var slotBinding = getAndRemoveAttrByRegex(el, slotRE);
        if (slotBinding) {
          {
            // 不同插槽语法禁止混合使用
            if (el.slotTarget || el.slotScope) {
              warn$2(
                "Unexpected mixed usage of different slot syntaxes.",
                el
              );
            }
            if (el.parent && !maybeComponent(el.parent)) {
              warn$2(
                "<template v-slot> can only appear at the root level inside " +
                "the receiving component",
                el
              );
            }
          }
          var ref = getSlotName(slotBinding);
          var name = ref.name;
          var dynamic = ref.dynamic;
          // 插槽名称
          el.slotTarget = name;
          // 是否为动态插槽
          el.slotTargetDynamic = dynamic;
          // 作用域插槽的值
          el.slotScope = slotBinding.value || emptySlotScopeToken; // force it into a scoped slot for perf
        }
      } else {
        // v-slot on component, denotes default slot
        var slotBinding$1 = getAndRemoveAttrByRegex(el, slotRE);
        if (slotBinding$1) {
          {
            // v-slot 只能出现在 组件 或 template 标签上
            if (!maybeComponent(el)) {
              warn$2(
                "v-slot can only be used on components or <template>.",
                slotBinding$1
              );
            }
            // 语法混用
            if (el.slotScope || el.slotTarget) {
              warn$2(
                "Unexpected mixed usage of different slot syntaxes.",
                el
              );
            }
            // 为避免歧义，存在其他命名插槽时，默认插槽应该使用 template 语法
            if (el.scopedSlots) {
              warn$2(
                "To avoid scope ambiguity, the default slot should also use " +
                "<template> syntax when there are other named slots.",
                slotBinding$1
              );
            }
          }
          // add the component's children to its default slot
          var slots = el.scopedSlots || (el.scopedSlots = {});
          var ref$1 = getSlotName(slotBinding$1);
          var name$1 = ref$1.name;
          var dynamic$1 = ref$1.dynamic;
          // 创建一个 template 标签的 ast 对象，用于容纳插槽内容，父级是 el
          var slotContainer = slots[name$1] = createASTElement('template', [], el);
          slotContainer.slotTarget = name$1;
          slotContainer.slotTargetDynamic = dynamic$1;
          // 将子元素的 parent 属性设置为 slotContainer
          slotContainer.children = el.children.filter(function (c) {
            if (!c.slotScope) {
              c.parent = slotContainer;
              return true
            }
          });
          slotContainer.slotScope = slotBinding$1.value || emptySlotScopeToken;
          // remove children as they are returned from scopedSlots now
          el.children = [];
          // mark el non-plain so data gets generated
          el.plain = false;
        }
      }
    }
  }

  // 解析 binding，得到插槽名称以及是否为动态插槽
  // { name:插槽名称，dynamic: 是否为动态插槽 }
  function getSlotName (binding) {
    var name = binding.name.replace(slotRE, '');
    if (!name) {
      if (binding.name[0] !== '#') {
        name = 'default';
      } else {
        warn$2(
          "v-slot shorthand syntax requires a slot name.",
          binding
        );
      }
    }
    return dynamicArgRE.test(name)
      // dynamic [name]
      ? { name: name.slice(1, -1), dynamic: true }
      // static name
      : { name: ("\"" + name + "\""), dynamic: false }
  }

  // handle <slot/> outlets
  // 处理自闭合 slot 标签
  function processSlotOutlet (el) {
    if (el.tag === 'slot') {
      // 获取 插槽名称
      el.slotName = getBindingAttr(el, 'name');
      // 不要在 slot 标签上使用 key
      if ( el.key) {
        warn$2(
          "`key` does not work on <slot> because slots are abstract outlets " +
          "and can possibly expand into multiple elements. " +
          "Use the key on a wrapping element instead.",
          getRawBindingAttr(el, 'key')
        );
      }
    }
  }

  // <component :is="comName" inline-template></component>
  // 动态组件
  function processComponent (el) {
    var binding;
    // 获取 is 属性值，即当前显示的组件的名称 
    if ((binding = getBindingAttr(el, 'is'))) {
      el.component = binding;
    }
    // 存在 inline-template 属性时,将标签中的子元素不作为插槽处理
    // 会将子元素作为组件内容来定义
    if (getAndRemoveAttr(el, 'inline-template') != null) {
      el.inlineTemplate = true;
    }
  }

  function processAttrs (el) {
    var list = el.attrsList;
    var i, l, name, rawName, value, modifiers, syncGen, isDynamic;
    for (i = 0, l = list.length; i < l; i++) {
      // 属性名称
      name = rawName = list[i].name;
      // 属性值
      value = list[i].value;
      // 处理动态属性，比如指令相关的
      if (dirRE.test(name)) {
        // mark element as dynamic
        // 标记为动态元素
        el.hasBindings = true;
        // modifiers
        // 处理修饰符
        modifiers = parseModifiers(name.replace(dirRE, ''));
        // support .foo shorthand syntax for the .prop modifier
        if (modifiers) {
          // 将属性名上的修饰符去掉 得到一个干净的属性名称
          name = name.replace(modifierRE, '');
        }
        // 处理 v-bind 指令属性
        if (bindRE.test(name)) { // v-bind
          // 属性名 比如 id
          name = name.replace(bindRE, '');
          // 属性值
          value = parseFilters(value);
          // 判断是否为动态属性
          // <div v-bind:[name]="xxx"></div>
          isDynamic = dynamicArgRE.test(name);
          if (isDynamic) {
            // 如果是动态属性，则去掉属性两边的方括号 []
            name = name.slice(1, -1);
          }
          if (
            
            value.trim().length === 0
          ) {
            warn$2(
              ("The value for a v-bind expression cannot be empty. Found in \"v-bind:" + name + "\"")
            );
          }
          // 修饰符
          if (modifiers) {
            if (modifiers.prop && !isDynamic) {
              name = camelize(name);
              if (name === 'innerHtml') { name = 'innerHTML'; }
            }
            if (modifiers.camel && !isDynamic) {
              name = camelize(name);
            }
            // 处理 sync 修饰符
            if (modifiers.sync) {
              syncGen = genAssignmentCode(value, "$event");
              if (!isDynamic) {
                addHandler(
                  el,
                  ("update:" + (camelize(name))),
                  syncGen,
                  null,
                  false,
                  warn$2,
                  list[i]
                );
                if (hyphenate(name) !== camelize(name)) {
                  addHandler(
                    el,
                    ("update:" + (hyphenate(name))),
                    syncGen,
                    null,
                    false,
                    warn$2,
                    list[i]
                  );
                }
              } else {
                // handler w/ dynamic event name
                addHandler(
                  el,
                  ("\"update:\"+(" + name + ")"),
                  syncGen,
                  null,
                  false,
                  warn$2,
                  list[i],
                  true // dynamic
                );
              }
            }
          }
          if ((modifiers && modifiers.prop) || (
            !el.component && platformMustUseProp(el.tag, el.attrsMap.type, name)
          )) {
            // 将属性对象添加到 el.props 数组中
            addProp(el, name, value, list[i], isDynamic);
          } else {
            // 将属性添加到 el.attrs 数组或 el.dynamic 数组
            addAttr(el, name, value, list[i], isDynamic);
          }
        } else if (onRE.test(name)) { // v-on
          // v-on 处理事件
          name = name.replace(onRE, '');
          isDynamic = dynamicArgRE.test(name);
          if (isDynamic) {
            name = name.slice(1, -1);
          }
          // 处理事件
          addHandler(el, name, value, modifiers, false, warn$2, list[i], isDynamic);
        } else { // normal directives
          // 其他的普通指令
          name = name.replace(dirRE, '');
          // parse arg
          var argMatch = name.match(argRE);
          var arg = argMatch && argMatch[1];
          isDynamic = false;
          if (arg) {
            name = name.slice(0, -(arg.length + 1));
            if (dynamicArgRE.test(arg)) {
              arg = arg.slice(1, -1);
              isDynamic = true;
            }
          }
          addDirective(el, name, rawName, value, arg, isDynamic, modifiers, list[i]);
          if ( name === 'model') {
            checkForAliasModel(el, value);
          }
        }
      } else {
        // literal attribute
        // 当前属性不是指令
        {
          var res = parseText(value, delimiters);
          if (res) {
            warn$2(
              name + "=\"" + value + "\": " +
              'Interpolation inside attributes has been removed. ' +
              'Use v-bind or the colon shorthand instead. For example, ' +
              'instead of <div id="{{ val }}">, use <div :id="val">.',
              list[i]
            );
          }
        }
        addAttr(el, name, JSON.stringify(value), list[i]);
        // #6887 firefox doesn't update muted state if set via attribute
        // even immediately after element creation
        if (!el.component &&
            name === 'muted' &&
            platformMustUseProp(el.tag, el.attrsMap.type, name)) {
          addProp(el, name, 'true', list[i]);
        }
      }
    }
  }

  function checkInFor (el) {
    var parent = el;
    while (parent) {
      if (parent.for !== undefined) {
        return true
      }
      parent = parent.parent;
    }
    return false
  }

  function parseModifiers (name) {
    var match = name.match(modifierRE);
    if (match) {
      var ret = {};
      match.forEach(function (m) { ret[m.slice(1)] = true; });
      return ret
    }
  }

  function makeAttrsMap (attrs) {
    var map = {};
    for (var i = 0, l = attrs.length; i < l; i++) {
      if (
        
        map[attrs[i].name] && !isIE && !isEdge
      ) {
        warn$2('duplicate attribute: ' + attrs[i].name, attrs[i]);
      }
      map[attrs[i].name] = attrs[i].value;
    }
    return map
  }

  // for script (e.g. type="x/template") or style, do not decode content
  function isTextTag (el) {
    return el.tag === 'script' || el.tag === 'style'
  }

  function isForbiddenTag (el) {
    return (
      el.tag === 'style' ||
      (el.tag === 'script' && (
        !el.attrsMap.type ||
        el.attrsMap.type === 'text/javascript'
      ))
    )
  }

  var ieNSBug = /^xmlns:NS\d+/;
  var ieNSPrefix = /^NS\d+:/;

  /* istanbul ignore next */
  function guardIESVGBug (attrs) {
    var res = [];
    for (var i = 0; i < attrs.length; i++) {
      var attr = attrs[i];
      if (!ieNSBug.test(attr.name)) {
        attr.name = attr.name.replace(ieNSPrefix, '');
        res.push(attr);
      }
    }
    return res
  }

  function checkForAliasModel (el, value) {
    var _el = el;
    while (_el) {
      if (_el.for && _el.alias === value) {
        warn$2(
          "<" + (el.tag) + " v-model=\"" + value + "\">: " +
          "You are binding v-model directly to a v-for iteration alias. " +
          "This will not be able to modify the v-for source array because " +
          "writing to the alias is like modifying a function local variable. " +
          "Consider using an array of objects and use v-model on an object property instead.",
          el.rawAttrsMap['v-model']
        );
      }
      _el = _el.parent;
    }
  }

  /*  */

  /**
   * 处理包含 v-model 指令的 input 标签，但没处理 v-model 属性
   * 分别处理 input 为 checkbox、radio 和 其他的情况
   * input 具体为哪种情况由 el.ifConditions 中的条件判断
  */
  function preTransformNode (el, options) {
    // <input v-model='xxx' type='xxx' />
    if (el.tag === 'input') {
      var map = el.attrsMap;
      if (!map['v-model']) {
        // 没有 v-model 属性，直接返回
        return
      }

      // 获取 type 的值
      var typeBinding;
      if (map[':type'] || map['v-bind:type']) {
        // 得到对应属性的值
        typeBinding = getBindingAttr(el, 'type');
      }
      if (!map.type && !typeBinding && map['v-bind']) {
        typeBinding = "(" + (map['v-bind']) + ").type";
      }

      if (typeBinding) {
        // 得到 v-if 的值
        // <input v-model='xxx' v-if='xx' />
        // ifCondition = xx
        var ifCondition = getAndRemoveAttr(el, 'v-if', true);
        // 拼接 &&xx
        var ifConditionExtra = ifCondition ? ("&&(" + ifCondition + ")") : "";
        var hasElse = getAndRemoveAttr(el, 'v-else', true) != null;
        var elseIfCondition = getAndRemoveAttr(el, 'v-else-if', true);
        // 1. checkbox
        // <input type='checkbox' />
        // 克隆新的 el 对象
        var branch0 = cloneASTElement(el);
        // process for on the main node
        // 处理 v-for = " item in arr "
        processFor(branch0);
        // 给 el 对象添加 type 属性，置为 checkbox
        addRawAttr(branch0, 'type', 'checkbox');
        // 处理标签上的众多属性
        processElement(branch0, options);
        // 标记当前对象已经被处理过啦
        branch0.processed = true; // prevent it from double-processed
        branch0.if = "(" + typeBinding + ")==='checkbox'" + ifConditionExtra;
        addIfCondition(branch0, {
          exp: branch0.if,
          block: branch0
        });
        // 2. add radio else-if condition
        var branch1 = cloneASTElement(el);
        getAndRemoveAttr(branch1, 'v-for', true);
        addRawAttr(branch1, 'type', 'radio');
        processElement(branch1, options);
        addIfCondition(branch0, {
          exp: "(" + typeBinding + ")==='radio'" + ifConditionExtra,
          block: branch1
        });
        // 3. other
        var branch2 = cloneASTElement(el);
        getAndRemoveAttr(branch2, 'v-for', true);
        addRawAttr(branch2, ':type', typeBinding);
        processElement(branch2, options);
        addIfCondition(branch0, {
          exp: ifCondition,
          block: branch2
        });

        // 设置 else 或 else if 条件
        if (hasElse) {
          branch0.else = true;
        } else if (elseIfCondition) {
          branch0.elseif = elseIfCondition;
        }

        return branch0
      }
    }
  }

  function cloneASTElement (el) {
    return createASTElement(el.tag, el.attrsList.slice(), el.parent)
  }

  var model$1 = {
    preTransformNode: preTransformNode
  };

  var modules$1 = [
    klass$1,
    style$1,
    model$1
  ];

  /*  */

  function text (el, dir) {
    if (dir.value) {
      // 在 el 对象添加 textContent 属性，值为 _s(value)
      addProp(el, 'textContent', ("_s(" + (dir.value) + ")"), dir);
    }
  }

  /*  */

  function html (el, dir) {
    if (dir.value) {
      addProp(el, 'innerHTML', ("_s(" + (dir.value) + ")"), dir);
    }
  }

  var directives$1 = {
    model: model,
    text: text,
    html: html
  };

  /*  */

  var baseOptions = {
    expectHTML: true,
    // class、style、v-model(input)
    modules: modules$1,
    // 指令
    directives: directives$1,
    // pre 标签
    isPreTag: isPreTag,
    // 是否为 一元标签/自闭合标签
    isUnaryTag: isUnaryTag,
    // 规定了一些应该使用 props 进行绑定的属性
    mustUseProp: mustUseProp,
    // 只有开始标签的属性，结束标签浏览器会自动补全
    canBeLeftOpenTag: canBeLeftOpenTag,
    // 保留标签 （html + svg）
    isReservedTag: isReservedTag,
    // 获取标签的命名空间
    getTagNamespace: getTagNamespace,
    // 静态 key
    staticKeys: genStaticKeys(modules$1)
  };

  /*  */

  var isStaticKey;
  var isPlatformReservedTag;

  var genStaticKeysCached = cached(genStaticKeys$1);

  /**
   * Goal of the optimizer: walk the generated template AST tree
   * and detect sub-trees that are purely static, i.e. parts of
   * the DOM that never needs to change.
   *
   * Once we detect these sub-trees, we can:
   *
   * 1. Hoist them into constants, so that we no longer need to
   *    create fresh nodes for them on each re-render;
   * 2. Completely skip them in the patching process.
   */
  /**
   * 1：在 AST 中找出所有静态节点并打上标记
   * 2：在 AST 中找出所有静态根节点并打上标记
  */
  function optimize (root, options) {
    if (!root) { return }
    // 优化，获取静态 key，比如 staticStyle、staticClass
    isStaticKey = genStaticKeysCached(options.staticKeys || '');
    // 是否是平台保留标签
    isPlatformReservedTag = options.isReservedTag || no;
    // first pass: mark all non-static nodes.
    // 标记静态节点
    markStatic$1(root);
    // second pass: mark static roots.
    // 标记静态根节点
    markStaticRoots(root, false);
  }

  function genStaticKeys$1 (keys) {
    return makeMap(
      'type,tag,attrsList,attrsMap,plain,parent,children,attrs,start,end,rawAttrsMap' +
      (keys ? ',' + keys : '')
    )
  }

  // 标记静态节点，通过 static 属性来标记
  function markStatic$1 (node) {
    // 是否为静态节点
    node.static = isStatic(node);
    if (node.type === 1) {
      // do not make component slot content static. this avoids
      // 1. components not able to mutate slot nodes
      // 2. static slot content fails for hot-reloading
      // 不要让 组件槽位内容设置为静态节点，避免
      // 组件无法改变槽位节点
      // 静态槽位内容热加载失败
      if (
        // 非平台保留标签 && 不是 slot 标签 没有 inline-template 属性，直接结束
        !isPlatformReservedTag(node.tag) &&
        node.tag !== 'slot' &&
        node.attrsMap['inline-template'] == null
      ) {
        return
      }
      // 循环判断子节点
      for (var i = 0, l = node.children.length; i < l; i++) {
        var child = node.children[i];
        // 递归判断子节点
        markStatic$1(child);
        // 从上往下遍历判断，当前节点的子节点有不是静态节点，将当前节点设置为非静态节点
        if (!child.static) {
          node.static = false;
        }
      }
      // v-if、v-else-if、v-else 等指令时，子节点只渲染一个，其余没渲染的存在 ifConditions 中
      if (node.ifConditions) {
        for (var i$1 = 1, l$1 = node.ifConditions.length; i$1 < l$1; i$1++) {
          // 对 block 属性进行静态标记
          var block = node.ifConditions[i$1].block;
          markStatic$1(block);
          if (!block.static) {
            node.static = false;
          }
        }
      }
    }
  }

  // 标记静态根节点
  // isInFor： 当前节点是否被包裹在 v-for 指令所在的节点内
  function markStaticRoots (node, isInFor) {
    if (node.type === 1) {
      if (node.static || node.once) {
        // 节点是静态 或 节点上有 v-once 指令
        node.staticInFor = isInFor;
      }
      // For a node to qualify as a static root, it should have children that
      // are not just static text. Otherwise the cost of hoisting out will
      // outweigh the benefits and it's better off to just always render it fresh.
      // 为了使节点有资格作为静态根节点，它应具有不只是静态文本的子节点。 否则，优化的成本将超过收益，最好始终将其更新。
      // 节点本身是静态节点，拥有子节点，子节点不能只有一个文本节点
      if (node.static && node.children.length && !(
        node.children.length === 1 &&
        node.children[0].type === 3
      )) {
        // 节点是静态节点 && 存在子节点 && 子节点不能只有一个文本节点   标记为静态根节点
        node.staticRoot = true;
        return
      } else {
        node.staticRoot = false;
      }
      // 递归遍历子节点
      if (node.children) {
        for (var i = 0, l = node.children.length; i < l; i++) {
          markStaticRoots(node.children[i], isInFor || !!node.for);
        }
      }
      // 节点存在 v-if、v-else-if、v-else 时，对 block 做静态根节点标记
      if (node.ifConditions) {
        for (var i$1 = 1, l$1 = node.ifConditions.length; i$1 < l$1; i$1++) {
          markStaticRoots(node.ifConditions[i$1].block, isInFor);
        }
      }
    }
  }

  // 判断节点是否为静态节点
  function isStatic (node) {
    // 包含变量的动态文本节点
    if (node.type === 2) { // expression
      return false
    }
    // 不包含变量的纯文本节点
    if (node.type === 3) { // text
      return true
    }
    // 元素节点
    return !!(
      // 使用 v-pre 指令，断定是静态节点
      node.pre || (
        // 不能动态绑定语法，标签上不能有 v-、@、： 开头的属性
      !node.hasBindings && // no dynamic bindings
      // 不能使用 v-if、v-for、v-else 指令
      !node.if && !node.for && // not v-if or v-for or v-else
      // 不能是内置组件，标签名不能是 slot 和 component
      !isBuiltInTag(node.tag) && // not a built-in
      // 标签名必须是平台保留标签，不能是组件
      isPlatformReservedTag(node.tag) && // not a component
      // 当前节点的父节点不能是带有 v-for 的 template 标签
      !isDirectChildOfTemplateFor(node) &&
      // 节点的所有属性的 key 都必须是静态节点才有的 key； 
      // 只能是 type、tag、attrsList、attrsMap、plain、parent、children、attrs 之一
      Object.keys(node).every(isStaticKey)
    ))
  }

  function isDirectChildOfTemplateFor (node) {
    while (node.parent) {
      node = node.parent;
      if (node.tag !== 'template') {
        return false
      }
      if (node.for) {
        return true
      }
    }
    return false
  }

  /*  */

  var fnExpRE = /^([\w$_]+|\([^)]*?\))\s*=>|^function(?:\s+[\w$]+)?\s*\(/;
  var fnInvokeRE = /\([^)]*?\);*$/;
  var simplePathRE = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\['[^']*?']|\["[^"]*?"]|\[\d+]|\[[A-Za-z_$][\w$]*])*$/;

  // KeyboardEvent.keyCode aliases
  var keyCodes = {
    esc: 27,
    tab: 9,
    enter: 13,
    space: 32,
    up: 38,
    left: 37,
    right: 39,
    down: 40,
    'delete': [8, 46]
  };

  // KeyboardEvent.key aliases
  var keyNames = {
    // #7880: IE11 and Edge use `Esc` for Escape key name.
    esc: ['Esc', 'Escape'],
    tab: 'Tab',
    enter: 'Enter',
    // #9112: IE11 uses `Spacebar` for Space key name.
    space: [' ', 'Spacebar'],
    // #7806: IE11 uses key names without `Arrow` prefix for arrow keys.
    up: ['Up', 'ArrowUp'],
    left: ['Left', 'ArrowLeft'],
    right: ['Right', 'ArrowRight'],
    down: ['Down', 'ArrowDown'],
    // #9112: IE11 uses `Del` for Delete key name.
    'delete': ['Backspace', 'Delete', 'Del']
  };

  // #4868: modifiers that prevent the execution of the listener
  // need to explicitly return null so that we can determine whether to remove
  // the listener for .once
  var genGuard = function (condition) { return ("if(" + condition + ")return null;"); };

  var modifierCode = {
    stop: '$event.stopPropagation();',
    prevent: '$event.preventDefault();',
    self: genGuard("$event.target !== $event.currentTarget"),
    ctrl: genGuard("!$event.ctrlKey"),
    shift: genGuard("!$event.shiftKey"),
    alt: genGuard("!$event.altKey"),
    meta: genGuard("!$event.metaKey"),
    left: genGuard("'button' in $event && $event.button !== 0"),
    middle: genGuard("'button' in $event && $event.button !== 1"),
    right: genGuard("'button' in $event && $event.button !== 2")
  };

  // 自定义事件的代码
  function genHandlers (
    events,
    isNative
  ) {
    // 前缀是 nativeOn： 还是 on：
    var prefix = isNative ? 'nativeOn:' : 'on:';
    // 静态
    var staticHandlers = "";
    // 动态
    var dynamicHandlers = "";
    // events = [{ name: { value: 回调函数名, ... } }]
    for (var name in events) {
      // 'methodsName' 或 '[method1, method2, ...]', this.methodName
      var handlerCode = genHandler(events[name]);
      if (events[name] && events[name].dynamic) {
        // 存在动态事件， 'eventName, handleCode'
        dynamicHandlers += name + "," + handlerCode + ",";
      } else {
        // 静态事件 'eventName: handleCode'
        staticHandlers += "\"" + name + "\":" + handlerCode + ",";
      }
    }
    // 去掉末尾的逗号
    staticHandlers = "{" + (staticHandlers.slice(0, -1)) + "}";
    if (dynamicHandlers) {
      // 动态返回结果： on：_d(staticHandlers, [dynamicHandlers])
      return prefix + "_d(" + staticHandlers + ",[" + (dynamicHandlers.slice(0, -1)) + "])"
    } else {
      // 静态： on：{staticHandlers}
      return prefix + staticHandlers
    }
  }

  function genHandler (handler) {
    if (!handler) {
      return 'function(){}'
    }

    if (Array.isArray(handler)) {
      return ("[" + (handler.map(function (handler) { return genHandler(handler); }).join(',')) + "]")
    }

    var isMethodPath = simplePathRE.test(handler.value);
    var isFunctionExpression = fnExpRE.test(handler.value);
    var isFunctionInvocation = simplePathRE.test(handler.value.replace(fnInvokeRE, ''));

    if (!handler.modifiers) {
      if (isMethodPath || isFunctionExpression) {
        return handler.value
      }
      return ("function($event){" + (isFunctionInvocation ? ("return " + (handler.value)) : handler.value) + "}") // inline statement
    } else {
      var code = '';
      var genModifierCode = '';
      var keys = [];
      for (var key in handler.modifiers) {
        if (modifierCode[key]) {
          genModifierCode += modifierCode[key];
          // left/right
          if (keyCodes[key]) {
            keys.push(key);
          }
        } else if (key === 'exact') {
          var modifiers = (handler.modifiers);
          genModifierCode += genGuard(
            ['ctrl', 'shift', 'alt', 'meta']
              .filter(function (keyModifier) { return !modifiers[keyModifier]; })
              .map(function (keyModifier) { return ("$event." + keyModifier + "Key"); })
              .join('||')
          );
        } else {
          keys.push(key);
        }
      }
      if (keys.length) {
        code += genKeyFilter(keys);
      }
      // Make sure modifiers like prevent and stop get executed after key filtering
      if (genModifierCode) {
        code += genModifierCode;
      }
      var handlerCode = isMethodPath
        ? ("return " + (handler.value) + ".apply(null, arguments)")
        : isFunctionExpression
          ? ("return (" + (handler.value) + ").apply(null, arguments)")
          : isFunctionInvocation
            ? ("return " + (handler.value))
            : handler.value;
      return ("function($event){" + code + handlerCode + "}")
    }
  }

  function genKeyFilter (keys) {
    return (
      // make sure the key filters only apply to KeyboardEvents
      // #9441: can't use 'keyCode' in $event because Chrome autofill fires fake
      // key events that do not have keyCode property...
      "if(!$event.type.indexOf('key')&&" +
      (keys.map(genFilterCode).join('&&')) + ")return null;"
    )
  }

  function genFilterCode (key) {
    var keyVal = parseInt(key, 10);
    if (keyVal) {
      return ("$event.keyCode!==" + keyVal)
    }
    var keyCode = keyCodes[key];
    var keyName = keyNames[key];
    return (
      "_k($event.keyCode," +
      (JSON.stringify(key)) + "," +
      (JSON.stringify(keyCode)) + "," +
      "$event.key," +
      "" + (JSON.stringify(keyName)) +
      ")"
    )
  }

  /*  */

  function on (el, dir) {
    if ( dir.modifiers) {
      warn("v-on without argument does not support modifiers.");
    }
    el.wrapListeners = function (code) { return ("_g(" + code + "," + (dir.value) + ")"); };
  }

  /*  */

  function bind$1 (el, dir) {
    el.wrapData = function (code) {
      return ("_b(" + code + ",'" + (el.tag) + "'," + (dir.value) + "," + (dir.modifiers && dir.modifiers.prop ? 'true' : 'false') + (dir.modifiers && dir.modifiers.sync ? ',true' : '') + ")")
    };
  }

  /*  */

  var baseDirectives = {
    on: on,
    bind: bind$1,
    cloak: noop
  };

  /*  */





  var CodegenState = function CodegenState (options) {
    this.options = options;
    this.warn = options.warn || baseWarn;
    this.transforms = pluckModuleFunction(options.modules, 'transformCode');
    this.dataGenFns = pluckModuleFunction(options.modules, 'genData');
    this.directives = extend(extend({}, baseDirectives), options.directives);
    var isReservedTag = options.isReservedTag || no;
    this.maybeComponent = function (el) { return !!el.component || !isReservedTag(el.tag); };
    this.onceId = 0;
    this.staticRenderFns = [];
    this.pre = false;
  };



  // AST 生成渲染函数
  function generate (
    ast,
    // 配置选项
    options
  ) {
    // 实例化 CodegenState 对象，生成代码的时候需要用到其中的一些东西
    var state = new CodegenState(options);
    // fix #11483, Root level <script> tags should not be rendered. 呈现
    // 判断是否为空
    var code = ast ? (ast.tag === 'script' ? 'null' : genElement(ast, state)) : '_c("div")';
    return {
      // 动态节点的渲染函数
      render: ("with(this){return " + code + "}"),
      // 静态节点渲染函数的数组
      staticRenderFns: state.staticRenderFns
    }
  }

  // 处理 ast 对象，得到一个可执行函数的 字符串 形式，比如 _c(tag, data, children, normalizationType)
  function genElement (el, state) {
    if (el.parent) {
      el.pre = el.pre || el.parent.pre;
    }

    // 根据当前 AST 元素节点属性的不同从而执行不同的代码生成函数
    if (el.staticRoot && !el.staticProcessed) {
      // _m(idx)
      // idx 是当前静态节点的渲染函数在 staticRenderFns 数据中的下标
      return genStatic(el, state)
    } else if (el.once && !el.onceProcessed) {
      // 处理节点上的 v-once 指令
      return genOnce(el, state)
    } else if (el.for && !el.forProcessed) {
      // 处理节点上的 v-for 指令
      return genFor(el, state)
    } else if (el.if && !el.ifProcessed) {
      // 处理节点上的 v-if 指令 得到一个 三元表达式
      return genIf(el, state)
    } else if (el.tag === 'template' && !el.slotTarget && !state.pre) {
      // 当前节点是 template 标签 && 不是插槽 && 不带 v-pre 指令
      return genChildren(el, state) || 'void 0'
    } else if (el.tag === 'slot') {
      //  处理 slot 标签
      return genSlot(el, state)
    } else {
      // component or element
      // 处理动态组件或普通元素（自定义组件和平台保留标签）
      var code;
      if (el.component) {
        // 动态组件
        code = genComponent(el.component, el, state);
      } else {
        // 获取节点属性 data
        var data;
        // plain：true 节点没有属性
        if (!el.plain || (el.pre && state.maybeComponent(el))) {
          // 最终是个 JSON 字符串
          data = genData$2(el, state);
        }

        // 获取子节点列表 children
        var children = el.inlineTemplate ? null : genChildren(el, state, true);
        // _c(tag, data, children, normalizationType)   normalizationType： 节点的规范类型
        code = "_c('" + (el.tag) + "'" + (data ? ("," + data) : '') + (children ? ("," + children) : '') + ")";
      }
      // module transforms
      //分别为 code 执行 transformNode 方法
      for (var i = 0; i < state.transforms.length; i++) {
        code = state.transforms[i](el, code);
      }
      return code
    }
  }

  // hoist static sub-trees out
  // 处理静态节点，生成静态节点的渲染函数，将其放到 static.staticRenderFns 数组中， 返回 _m(idx)
  function genStatic (el, state) {
    // 标记当前静态节点已经被处理，避免额外的递归
    el.staticProcessed = true;
    // Some elements (templates) need to behave differently inside of a v-pre
    // node.  All pre nodes are static roots, so we can use this as a location to
    // wrap a state change and reset it upon exiting the pre node.
    var originalPreState = state.pre;
    if (el.pre) {
      state.pre = el.pre;
    }
    // 调用 genElement 方法得到静态节点渲染函数，将其 push到 staticRenderFns 数组中，包装成 'with(this){return _c(xxx)}'
    state.staticRenderFns.push(("with(this){return " + (genElement(el, state)) + "}"));
    state.pre = originalPreState;
    // 返回可执行函数，_m(idx, true or '')
    // idx: 当前静态节点的渲染函数在 staticRenderFns 数组的下标
    return ("_m(" + (state.staticRenderFns.length - 1) + (el.staticInFor ? ',true' : '') + ")")
  }

  // v-once
  /**
   * 处理带有 v-once 指令的节点：
   *  1： 当前节点存在 v-if 指令，得到 三元表达式： exp ? render1 : render2
   *  2： 当前节点包含在 v-for 指令的内部， 得到 _o(_c(tag, data, children), number, key)
   *  3： 当前节点是 v-once 节点， 得到 _m(idx, true or '')
  */
  function genOnce (el, state) {
    el.onceProcessed = true;
    // 如果存在 v-if 指令 && 没处理
    if (el.if && !el.ifProcessed) {
      return genIf(el, state)
    } else if (el.staticInFor) {
      // 当前节点被包裹在 v-for 指令
      var key = '';
      var parent = el.parent;
      while (parent) {
        if (parent.for) {
          key = parent.key;
          break
        }
        parent = parent.parent;
      }
      if (!key) {
         state.warn(
          "v-once can only be used inside v-for that is keyed. ",
          el.rawAttrsMap['v-once']
        );
        return genElement(el, state)
      }
      // 返回结果 _o(_c(xxx), number, key)
      return ("_o(" + (genElement(el, state)) + "," + (state.onceId++) + "," + key + ")")
    } else {
      // 按静态节点方式处理
      return genStatic(el, state)
    }
  }

  // 处理 v-if 指令，最终得到一个 三元表达式
  function genIf (
    el,
    state,
    altGen,
    altEmpty
  ) {
    el.ifProcessed = true; // avoid recursion
    return genIfConditions(el.ifConditions.slice(), state, altGen, altEmpty)
  }

  function genIfConditions (
    conditions,
    state,
    altGen,
    altEmpty
  ) {
    // 空数组时 会渲染一个 _e() 空节点
    if (!conditions.length) {
      return altEmpty || '_e()'
    }

    // 取出第一个
    var condition = conditions.shift();
    if (condition.exp) {
      // 最终返回的是一个 三元表达式： exp ? render1 : render2
      return ("(" + (condition.exp) + ")?" + (genTernaryExp(condition.block)) + ":" + (genIfConditions(conditions, state, altGen, altEmpty)))
    } else {
      return ("" + (genTernaryExp(condition.block)))
    }

    // v-if with v-once should generate code like (a)?_m(0):_m(1)
    function genTernaryExp (el) {
      return altGen
        ? altGen(el, state)
        : el.once
          ? genOnce(el, state)
          : genElement(el, state)
    }
  }

  // 处理 v-for 指令 _l(exp, function(alias, iterator1, iterator2) { return _c(xxx) })
  function genFor (
    el,
    state,
    altGen,
    altHelper
  ) {
    // v-for = "(item, index) in arr"
    // exp = arr
    var exp = el.for;
    // alias = item
    var alias = el.alias;
    // index
    var iterator1 = el.iterator1 ? ("," + (el.iterator1)) : '';
    var iterator2 = el.iterator2 ? ("," + (el.iterator2)) : '';

    // 提示 v-for 指令时 组件需要 key
    if (
      state.maybeComponent(el) &&
      el.tag !== 'slot' &&
      el.tag !== 'template' &&
      !el.key
    ) {
      state.warn(
        "<" + (el.tag) + " v-for=\"" + alias + " in " + exp + "\">: component lists rendered with " +
        "v-for should have explicit keys. " +
        "See https://vuejs.org/guide/list.html#key for more info.",
        el.rawAttrsMap['v-for'],
        true /* tip */
      );
    }

    // 标记 已处理
    el.forProcessed = true; // avoid recursion
    // v-for 指令的处理结果 得到 _l(exp, function(alias, iterator1, iterator2) return{ _c(tag, data, children) ]})
    return (altHelper || '_l') + "((" + exp + ")," +
      "function(" + alias + iterator1 + iterator2 + "){" +
        "return " + ((altGen || genElement)(el, state)) +
      '})'
  }

  // 处理节点上的所有属性，得到一个 JSON 字符串
  function genData$2 (el, state) {
    // 节点属性组成的 JSON 字符串
    var data = '{';

    // directives first.
    // directives may mutate the el's other properties before they are generated.
    // 指令可以对 el 其他属性被生成之前改变它们
    var dirs = genDirectives(el, state);
    if (dirs) { data += dirs + ','; }

    // key
    // data = { key: xxx }
    if (el.key) {
      data += "key:" + (el.key) + ",";
    }
    // ref
    // data = { ref: xxx }
    if (el.ref) {
      data += "ref:" + (el.ref) + ",";
    }
    // 带有 ref 指令 属性的节点，如果被包含在 v-for 指令节点内部 data = { refInFor: true }
    if (el.refInFor) {
      data += "refInFor:true,";
    }
    // pre
    // v-pre 指令， data = { pre: true }
    if (el.pre) {
      data += "pre:true,";
    }
    // record original tag name for components using "is" attribute
    // 动态组件 data = { tag: component }
    if (el.component) {
      data += "tag:\"" + (el.tag) + "\",";
    }
    // module data generation functions
    // 执行模块 { class、style } 的 genData 方法，处理节点上的 style 和 class 
    // 最终得到 data = { staticClass: xx, class: xx, staticStyle: xx, style: xx }
    for (var i = 0; i < state.dataGenFns.length; i++) {
      data += state.dataGenFns[i](el);
    }
    // attributes
    // 处理属性
    if (el.attrs) {
      data += "attrs:" + (genProps(el.attrs)) + ",";
    }
    // DOM props
    if (el.props) {
      data += "domProps:" + (genProps(el.props)) + ",";
    }
    // event handlers
    // 处理不带 native 事件
    if (el.events) {
      data += (genHandlers(el.events, false)) + ",";
    }
    // 处理带有 native 事件
    if (el.nativeEvents) {
      data += (genHandlers(el.nativeEvents, true)) + ",";
    }
    // slot target
    // only for non-scoped slots
    // 处理非作用域插槽
    if (el.slotTarget && !el.slotScope) {
      data += "slot:" + (el.slotTarget) + ",";
    }
    // scoped slots
    // 处理作用域插槽  data = { scopedSlots: _u:(xx) }
    if (el.scopedSlots) {
      data += (genScopedSlots(el, el.scopedSlots, state)) + ",";
    }
    // component v-model
    // 处理带有 v-model 指令的组件  data = { model: value, callback, expression }
    if (el.model) {
      data += "model:{value:" + (el.model.value) + ",callback:" + (el.model.callback) + ",expression:" + (el.model.expression) + "},";
    }
    // inline-template
    // 处理内联模板
    if (el.inlineTemplate) {
      var inlineTemplate = genInlineTemplate(el, state);
      if (inlineTemplate) {
        data += inlineTemplate + ",";
      }
    }
    data = data.replace(/,$/, '') + '}';
    // v-bind dynamic argument wrap
    // v-bind with dynamic arguments must be applied using the same v-bind object
    // merge helper so that class/style/mustUseProp attrs are handled correctly.
    if (el.dynamicAttrs) {
      // 存在动态属性 data = '_b(data, tag, 静态属性 或 _d(静态属性， 动态属性))'
      data = "_b(" + data + ",\"" + (el.tag) + "\"," + (genProps(el.dynamicAttrs)) + ")";
    }
    // v-bind data wrap
    if (el.wrapData) {
      data = el.wrapData(data);
    }
    // v-on data wrap
    if (el.wrapListeners) {
      data = el.wrapListeners(data);
    }
    return data
  }

  // 编译指令，如果指令存在运行时任务，则 return 指令信息出去
  function genDirectives (el, state) {
    // 所有指令
    var dirs = el.directives;
    if (!dirs) { return }
    // 最终处理返回的结果
    var res = 'directives:[';
    // 标记当前指令是否存在运行时的任务
    var hasRuntime = false;
    var i, l, dir, needRuntime;
    for (i = 0, l = dirs.length; i < l; i++) {
      dir = dirs[i];
      needRuntime = true;
      // 获取当前指令的处理方法，比如 web 平台的 v-html、v-text、v-model
      var gen = state.directives[dir.name];
      if (gen) {
        // compile-time directive that manipulates AST.
        // returns true if it also needs a runtime counterpart.
        // 执行 gen 方法，编译当前指令，比如 v-text、v-model
        // 返回结果为 Boolean，标记当前指令是否存在运行时的任务
        needRuntime = !!gen(el, dir, state.warn);
      }
      if (needRuntime) {
        // 该指令在运行时还有任务
        // res = directives: [{name, rawName, value, expression, arg, modifiers},...]
        hasRuntime = true;
        res += "{name:\"" + (dir.name) + "\",rawName:\"" + (dir.rawName) + "\"" + (dir.value ? (",value:(" + (dir.value) + "),expression:" + (JSON.stringify(dir.value))) : '') + (dir.arg ? (",arg:" + (dir.isDynamicArg ? dir.arg : ("\"" + (dir.arg) + "\""))) : '') + (dir.modifiers ? (",modifiers:" + (JSON.stringify(dir.modifiers))) : '') + "},";
      }
    }
    if (hasRuntime) {
      // 指令存在运行时任务时，才会返回 res
      return res.slice(0, -1) + ']'
    }
  }

  function genInlineTemplate (el, state) {
    var ast = el.children[0];
    if ( (
      el.children.length !== 1 || ast.type !== 1
    )) {
      state.warn(
        'Inline-template components must have exactly one child element.',
        { start: el.start }
      );
    }
    if (ast && ast.type === 1) {
      var inlineRenderFns = generate(ast, state.options);
      return ("inlineTemplate:{render:function(){" + (inlineRenderFns.render) + "},staticRenderFns:[" + (inlineRenderFns.staticRenderFns.map(function (code) { return ("function(){" + code + "}"); }).join(',')) + "]}")
    }
  }

  function genScopedSlots (
    el,
    slots,
    state
  ) {
    // by default scoped slots are considered "stable", this allows child
    // components with only scoped slots to skip forced updates from parent.
    // but in some cases we have to bail-out of this optimization
    // for example if the slot contains dynamic names, has v-if or v-for on them...
    var needsForceUpdate = el.for || Object.keys(slots).some(function (key) {
      var slot = slots[key];
      return (
        slot.slotTargetDynamic ||
        slot.if ||
        slot.for ||
        containsSlotChild(slot) // is passing down slot from parent which may be dynamic
      )
    });

    // #9534: if a component with scoped slots is inside a conditional branch,
    // it's possible for the same component to be reused but with different
    // compiled slot content. To avoid that, we generate a unique key based on
    // the generated code of all the slot contents.
    var needsKey = !!el.if;

    // OR when it is inside another scoped slot or v-for (the reactivity may be
    // disconnected due to the intermediate scope variable)
    // #9438, #9506
    // TODO: this can be further optimized by properly analyzing in-scope bindings
    // and skip force updating ones that do not actually use scope variables.
    if (!needsForceUpdate) {
      var parent = el.parent;
      while (parent) {
        if (
          (parent.slotScope && parent.slotScope !== emptySlotScopeToken) ||
          parent.for
        ) {
          needsForceUpdate = true;
          break
        }
        if (parent.if) {
          needsKey = true;
        }
        parent = parent.parent;
      }
    }

    var generatedSlots = Object.keys(slots)
      .map(function (key) { return genScopedSlot(slots[key], state); })
      .join(',');

    return ("scopedSlots:_u([" + generatedSlots + "]" + (needsForceUpdate ? ",null,true" : "") + (!needsForceUpdate && needsKey ? (",null,false," + (hash(generatedSlots))) : "") + ")")
  }

  function hash(str) {
    var hash = 5381;
    var i = str.length;
    while(i) {
      hash = (hash * 33) ^ str.charCodeAt(--i);
    }
    return hash >>> 0
  }

  function containsSlotChild (el) {
    if (el.type === 1) {
      if (el.tag === 'slot') {
        return true
      }
      return el.children.some(containsSlotChild)
    }
    return false
  }

  function genScopedSlot (
    el,
    state
  ) {
    var isLegacySyntax = el.attrsMap['slot-scope'];
    if (el.if && !el.ifProcessed && !isLegacySyntax) {
      return genIf(el, state, genScopedSlot, "null")
    }
    if (el.for && !el.forProcessed) {
      return genFor(el, state, genScopedSlot)
    }
    var slotScope = el.slotScope === emptySlotScopeToken
      ? ""
      : String(el.slotScope);
    var fn = "function(" + slotScope + "){" +
      "return " + (el.tag === 'template'
        ? el.if && isLegacySyntax
          ? ("(" + (el.if) + ")?" + (genChildren(el, state) || 'undefined') + ":undefined")
          : genChildren(el, state) || 'undefined'
        : genElement(el, state)) + "}";
    // reverse proxy v-slot without scope on this.$slots
    var reverseProxy = slotScope ? "" : ",proxy:true";
    return ("{key:" + (el.slotTarget || "\"default\"") + ",fn:" + fn + reverseProxy + "}")
  }

  // 遍历 AST 的 children 属性中的元素，根据元素属性的不同生成不同的 VNode 创建函数调用字符串
  function genChildren (
    el,
    state,
    checkSkip,
    altGenElement,
    altGenNode
  ) {
    // 拿到当前节点的所有子节点
    var children = el.children;
    if (children.length) {
      var el$1 = children[0];
      // optimize single v-for
      // 优化 v-for
      if (children.length === 1 &&
        el$1.for &&
        el$1.tag !== 'template' &&
        el$1.tag !== 'slot'
      ) {
        // 只有一个子节点 && 子节点有 v-for 指令 && 节点标签名不是 template 或 slot
        var normalizationType = checkSkip
          ? state.maybeComponent(el$1) ? ",1" : ",0"
          : "";
          // 直接调用 genElement 方法得到结果，不需要调用 genNode
        return ("" + ((altGenElement || genElement)(el$1, state)) + normalizationType)
      }
      // 得到节点规范化类型， 结果为 0、1、2
      var normalizationType$1 = checkSkip
        ? getNormalizationType(children, state.maybeComponent)
        : 0;
        // 生成代码的函数
      var gen = altGenNode || genNode;
      // 返回一个数组，数组的每个元素都是一个子节点的渲染函数
      return ("[" + (children.map(function (c) { return gen(c, state); }).join(',')) + "]" + (normalizationType$1 ? ("," + normalizationType$1) : ''))
    }
  }

  // determine the normalization needed for the children array.
  // 0: no normalization needed
  // 1: simple normalization needed (possible 1-level deep nested array)
  // 2: full normalization needed
  function getNormalizationType (
    children,
    maybeComponent
  ) {
    var res = 0;
    for (var i = 0; i < children.length; i++) {
      var el = children[i];
      if (el.type !== 1) {
        continue
      }
      if (needsNormalization(el) ||
          (el.ifConditions && el.ifConditions.some(function (c) { return needsNormalization(c.block); }))) {
        res = 2;
        break
      }
      if (maybeComponent(el) ||
          (el.ifConditions && el.ifConditions.some(function (c) { return maybeComponent(c.block); }))) {
        res = 1;
      }
    }
    return res
  }

  function needsNormalization (el) {
    return el.for !== undefined || el.tag === 'template' || el.tag === 'slot'
  }

  // 根据不同的节点类型
  function genNode (node, state) {
    if (node.type === 1) {
      return genElement(node, state)
    } else if (node.type === 3 && node.isComment) {
      return genComment(node)
    } else {
      return genText(node)
    }
  }

  // 文本节点
  function genText (text) {
    return ("_v(" + (text.type === 2
      // 动态文本
      ? text.expression // no need for () because already wrapped in _s()
      // 静态文本
      : transformSpecialNewlines(JSON.stringify(text.text))) + ")")
  }

  // 注释节点
  function genComment (comment) {
    return ("_e(" + (JSON.stringify(comment.text)) + ")")
  }

  // 生成插槽的渲染函数，得到 _t(slotName, children, attrs, bind)
  function genSlot (el, state) {
    // 获取插槽名
    var slotName = el.slotName || '"default"';
    // 获取所有的子节点
    var children = genChildren(el, state);
    // 结果 res = '_t(slotName, children, attrs, bind)'
    var res = "_t(" + slotName + (children ? (",function(){return " + children + "}") : '');
    var attrs = el.attrs || el.dynamicAttrs
      ? genProps((el.attrs || []).concat(el.dynamicAttrs || []).map(function (attr) { return ({
          // slot props are camelized
          name: camelize(attr.name),
          value: attr.value,
          dynamic: attr.dynamic
        }); }))
      : null;
    var bind = el.attrsMap['v-bind'];
    if ((attrs || bind) && !children) {
      res += ",null";
    }
    if (attrs) {
      res += "," + attrs;
    }
    if (bind) {
      res += (attrs ? '' : ',null') + "," + bind;
    }
    return res + ')'
  }

  // componentName is el.component, take it as argument to shun flow's pessimistic refinement
  // 处理动态组件，得到 _c(componentName, data, children)
  function genComponent (
    componentName,
    el,
    state
  ) {
    // 生成所有子节点渲染函数
    var children = el.inlineTemplate ? null : genChildren(el, state, true);
    // _c(componentName, data, children)
    return ("_c(" + componentName + "," + (genData$2(el, state)) + (children ? ("," + children) : '') + ")")
  }

  /**
   * 遍历属性数组 props，得到所有属性组成的字符串
   * 动态： _d(静态属性，动态属性)
   * 静态： 'attrName, attrValue'
  */
  function genProps (props) {
    // 静态属性
    var staticProps = "";
    // 动态属性
    var dynamicProps = "";
    for (var i = 0; i < props.length; i++) {
      var prop = props[i];
      var value =  transformSpecialNewlines(prop.value);
      if (prop.dynamic) {
        // 动态属性
        dynamicProps += (prop.name) + "," + value + ",";
      } else {
        staticProps += "\"" + (prop.name) + "\":" + value + ",";
      }
    }
    // 去掉属性最后的逗号
    staticProps = "{" + (staticProps.slice(0, -1)) + "}";
    if (dynamicProps) {
      // 动态属性 _d(staticProps, [])
      return ("_d(" + staticProps + ",[" + (dynamicProps.slice(0, -1)) + "])")
    } else {
      return staticProps
    }
  }

  // #3895, #4268
  function transformSpecialNewlines (text) {
    return text
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029')
  }

  /*  */



  // these keywords should not appear inside expressions, but operators like
  // typeof, instanceof and in are allowed
  var prohibitedKeywordRE = new RegExp('\\b' + (
    'do,if,for,let,new,try,var,case,else,with,await,break,catch,class,const,' +
    'super,throw,while,yield,delete,export,import,return,switch,default,' +
    'extends,finally,continue,debugger,function,arguments'
  ).split(',').join('\\b|\\b') + '\\b');

  // these unary operators should not be used as property/method names
  var unaryOperatorsRE = new RegExp('\\b' + (
    'delete,typeof,void'
  ).split(',').join('\\s*\\([^\\)]*\\)|\\b') + '\\s*\\([^\\)]*\\)');

  // strip strings in expressions
  var stripStringRE = /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*\$\{|\}(?:[^`\\]|\\.)*`|`(?:[^`\\]|\\.)*`/g;

  // detect problematic expressions in a template
  function detectErrors (ast, warn) {
    if (ast) {
      checkNode(ast, warn);
    }
  }

  function checkNode (node, warn) {
    if (node.type === 1) {
      for (var name in node.attrsMap) {
        if (dirRE.test(name)) {
          var value = node.attrsMap[name];
          if (value) {
            var range = node.rawAttrsMap[name];
            if (name === 'v-for') {
              checkFor(node, ("v-for=\"" + value + "\""), warn, range);
            } else if (name === 'v-slot' || name[0] === '#') {
              checkFunctionParameterExpression(value, (name + "=\"" + value + "\""), warn, range);
            } else if (onRE.test(name)) {
              checkEvent(value, (name + "=\"" + value + "\""), warn, range);
            } else {
              checkExpression(value, (name + "=\"" + value + "\""), warn, range);
            }
          }
        }
      }
      if (node.children) {
        for (var i = 0; i < node.children.length; i++) {
          checkNode(node.children[i], warn);
        }
      }
    } else if (node.type === 2) {
      checkExpression(node.expression, node.text, warn, node);
    }
  }

  function checkEvent (exp, text, warn, range) {
    var stripped = exp.replace(stripStringRE, '');
    var keywordMatch = stripped.match(unaryOperatorsRE);
    if (keywordMatch && stripped.charAt(keywordMatch.index - 1) !== '$') {
      warn(
        "avoid using JavaScript unary operator as property name: " +
        "\"" + (keywordMatch[0]) + "\" in expression " + (text.trim()),
        range
      );
    }
    checkExpression(exp, text, warn, range);
  }

  function checkFor (node, text, warn, range) {
    checkExpression(node.for || '', text, warn, range);
    checkIdentifier(node.alias, 'v-for alias', text, warn, range);
    checkIdentifier(node.iterator1, 'v-for iterator', text, warn, range);
    checkIdentifier(node.iterator2, 'v-for iterator', text, warn, range);
  }

  function checkIdentifier (
    ident,
    type,
    text,
    warn,
    range
  ) {
    if (typeof ident === 'string') {
      try {
        new Function(("var " + ident + "=_"));
      } catch (e) {
        warn(("invalid " + type + " \"" + ident + "\" in expression: " + (text.trim())), range);
      }
    }
  }

  function checkExpression (exp, text, warn, range) {
    try {
      new Function(("return " + exp));
    } catch (e) {
      var keywordMatch = exp.replace(stripStringRE, '').match(prohibitedKeywordRE);
      if (keywordMatch) {
        warn(
          "avoid using JavaScript keyword as property name: " +
          "\"" + (keywordMatch[0]) + "\"\n  Raw expression: " + (text.trim()),
          range
        );
      } else {
        warn(
          "invalid expression: " + (e.message) + " in\n\n" +
          "    " + exp + "\n\n" +
          "  Raw expression: " + (text.trim()) + "\n",
          range
        );
      }
    }
  }

  function checkFunctionParameterExpression (exp, text, warn, range) {
    try {
      new Function(exp, '');
    } catch (e) {
      warn(
        "invalid function parameter expression: " + (e.message) + " in\n\n" +
        "    " + exp + "\n\n" +
        "  Raw expression: " + (text.trim()) + "\n",
        range
      );
    }
  }

  /*  */

  var range = 2;

  function generateCodeFrame (
    source,
    start,
    end
  ) {
    if ( start === void 0 ) start = 0;
    if ( end === void 0 ) end = source.length;

    var lines = source.split(/\r?\n/);
    var count = 0;
    var res = [];
    for (var i = 0; i < lines.length; i++) {
      count += lines[i].length + 1;
      if (count >= start) {
        for (var j = i - range; j <= i + range || end > count; j++) {
          if (j < 0 || j >= lines.length) { continue }
          res.push(("" + (j + 1) + (repeat$1(" ", 3 - String(j + 1).length)) + "|  " + (lines[j])));
          var lineLength = lines[j].length;
          if (j === i) {
            // push underline
            var pad = start - (count - lineLength) + 1;
            var length = end > count ? lineLength - pad : end - start;
            res.push("   |  " + repeat$1(" ", pad) + repeat$1("^", length));
          } else if (j > i) {
            if (end > count) {
              var length$1 = Math.min(end - count, lineLength);
              res.push("   |  " + repeat$1("^", length$1));
            }
            count += lineLength + 1;
          }
        }
        break
      }
    }
    return res.join('\n')
  }

  function repeat$1 (str, n) {
    var result = '';
    if (n > 0) {
      while (true) { // eslint-disable-line
        if (n & 1) { result += str; }
        n >>>= 1;
        if (n <= 0) { break }
        str += str;
      }
    }
    return result
  }

  /*  */



  function createFunction (code, errors) {
    try {
      return new Function(code)
    } catch (err) {
      errors.push({ err: err, code: code });
      return noop
    }
  }

  function createCompileToFunctionFn (compile) {
    var cache = Object.create(null);

    /**
     * 1.执行编译函数，得到编译结果  compiled
     * 2.处理编译期间产生的 error 和 tip，分别输出到控制台
     * 3.将编译得到的字符串代码通过 new Function(code) 转换成可执行的函数
     * 4.缓存编译结果
     * 
    */
    return function compileToFunctions (
      // 字符串模板
      template,
      // 编译选项
      options,
      // 组件 实例
      vm
    ) {
      // 编译选项
      options = extend({}, options);
      // 日志
      var warn$1 = options.warn || warn;
      delete options.warn;

      /* istanbul ignore if */
      {
        // detect possible CSP restriction
        // 检测可能的 CSP 限制
        try {
          new Function('return 1');
        } catch (e) {
          if (e.toString().match(/unsafe-eval|CSP/)) {
            warn$1(
              'It seems you are using the standalone build of Vue.js in an ' +
              'environment with Content Security Policy that prohibits unsafe-eval. ' +
              'The template compiler cannot work in this environment. Consider ' +
              'relaxing the policy to allow unsafe-eval or pre-compiling your ' +
              'templates into render functions.'
            );
          }
        }
      }

      // check cache
      // 有缓存，则跳过编译，直接从缓存中获取编译结果
      var key = options.delimiters
        ? String(options.delimiters) + template
        : template;
      if (cache[key]) {
        return cache[key]
      }

      // compile
      // 执行编译函数，得到编译结果
      var compiled = compile(template, options);

      // check compilation errors/tips
      // 检查编译过程中产生的所有 error/tips，分别输出到控制台
      {
        if (compiled.errors && compiled.errors.length) {
          if (options.outputSourceRange) {
            compiled.errors.forEach(function (e) {
              warn$1(
                "Error compiling template:\n\n" + (e.msg) + "\n\n" +
                generateCodeFrame(template, e.start, e.end),
                vm
              );
            });
          } else {
            warn$1(
              "Error compiling template:\n\n" + template + "\n\n" +
              compiled.errors.map(function (e) { return ("- " + e); }).join('\n') + '\n',
              vm
            );
          }
        }
        if (compiled.tips && compiled.tips.length) {
          if (options.outputSourceRange) {
            compiled.tips.forEach(function (e) { return tip(e.msg, vm); });
          } else {
            compiled.tips.forEach(function (msg) { return tip(msg, vm); });
          }
        }
      }

      // turn code into functions
      // 编译结果，compiled.render： 字符串，是一个可执行函数的字符串
      var res = {};
      var fnGenErrors = [];
      // 通过 new Function(code) 将字符串转换成 函数
      res.render = createFunction(compiled.render, fnGenErrors);
      // 将静态节点的函数字符串转换成可执行函数
      res.staticRenderFns = compiled.staticRenderFns.map(function (code) {
        return createFunction(code, fnGenErrors)
      });

      // check function generation errors.
      // this should only happen if there is a bug in the compiler itself.
      // mostly for codegen development use
      /* istanbul ignore if */
      // 处理上面代码转换过程中出现的错误，这一步一般不会报错，除非编译器本身出错
      {
        if ((!compiled.errors || !compiled.errors.length) && fnGenErrors.length) {
          warn$1(
            "Failed to generate render function:\n\n" +
            fnGenErrors.map(function (ref) {
              var err = ref.err;
              var code = ref.code;

              return ((err.toString()) + " in\n\n" + code + "\n");
          }).join('\n'),
            vm
          );
        }
      }

      // 缓存编译结果
      return (cache[key] = res)
    }
  }

  /*  */

  function createCompilerCreator (baseCompile) {
    return function createCompiler (baseOptions) {
      /**
       * 编译函数:
       *   1.选项合并,将 options 配置项,合并到 finalOptions 中,得到最终的编译配置对象
       *   2.调用核心编译器 baseCompile 得到编译结果
       *   3.将编译期间产生的 error 和 tip 挂载到编译结果上,返回编译结果
      */
      function compile (
        // 模板字符串
        template,
        // 编译选项
        options
      ) {
        // 平台特有的编译选项，如 web 平台；以平台特有的编译配置为原型创建编译选项对象
        var finalOptions = Object.create(baseOptions);
        var errors = [];
        var tips = [];

        // 日志
        var warn = function (msg, range, tip) {
          (tip ? tips : errors).push(msg);
        };

        // 合并 options 和 baseOptions,将两者合并到 finalOptions 对象
        if (options) {
          if ( options.outputSourceRange) {
            // $flow-disable-line
            var leadingSpaceLength = template.match(/^\s*/)[0].length;

            // 增强 日志 方法
            warn = function (msg, range, tip) {
              var data = { msg: msg };
              if (range) {
                if (range.start != null) {
                  data.start = range.start + leadingSpaceLength;
                }
                if (range.end != null) {
                  data.end = range.end + leadingSpaceLength;
                }
              }
              (tip ? tips : errors).push(data);
            };
          }
          // merge custom modules
          // 将 options 中的配置项合并到 finalOptions
          // 合并自定义 module
          if (options.modules) {
            finalOptions.modules =
              (baseOptions.modules || []).concat(options.modules);
          }
          // merge custom directives
          // 合并自定义指令
          if (options.directives) {
            finalOptions.directives = extend(
              Object.create(baseOptions.directives || null),
              options.directives
            );
          }
          // copy other options
          // 拷贝其他配置项
          for (var key in options) {
            if (key !== 'modules' && key !== 'directives') {
              finalOptions[key] = options[key];
            }
          }
        }

        // 日志
        finalOptions.warn = warn;

        // 重点: 调用核心编译函数,传递字符串模板和最终的编译选项,得到编译结果; 执行 baseCompile 得到编译结果
        var compiled = baseCompile(template.trim(), finalOptions);
        {
          detectErrors(compiled.ast, warn);
        }
        // 将编译期间产生的错误和提示挂载到编译结果上
        compiled.errors = errors;
        compiled.tips = tips;
        // 返回编译结果
        return compiled
      }

      return {
        compile: compile,
        compileToFunctions: createCompileToFunctionFn(compile)
      }
    }
  }

  /*  */

  // `createCompilerCreator` allows creating compilers that use alternative
  // parser/optimizer/codegen, e.g the SSR optimizing compiler.
  // Here we just export a default compiler using the default parts.
  /**
   * 在这之前所有的事情，唯一目的：构建平台持有的编译选项（options）
   *   1.将 html 模板解析成 ast  --->  解析器
   *   2.对 ast 树进行静态标记  --->  优化器
   *   3.将 ast 生成渲染函数  --->  代码生成器
   *     静态渲染函数放到 code.staticRenderFns 数组中
   *     code.render 为动态渲染函数
   *     在将来渲染时执行渲染函数得到 vnode
  */
  // 把用户所写的模板转化成供 Vue 实例在挂载时可调用的 render 函数
  var createCompiler = createCompilerCreator(function baseCompile (
    template,
    options
  ) {
    // 模板编译阶段
    // 将模板解析为 AST，每个节点的 ast 对象上都设置了元素的所有信息，比如 标签信息、属性信息、插槽信息、父节点、子节点等
    // 具体有哪些属性，查看 start 和 end 这两个处理开始和结束标签的方法
    var ast = parse(template.trim(), options);
    // 优化阶段
    // 优化，遍历 AST，为每个节点做静态标记
    // 标记每个节点是否为静态节点，然后进一步标记静态根节点
    // 这样在后续更新中就可以跳过这些静态节点，减少比较过程，优化 patch 的性能
    // 标记静态根节点，用于生成渲染函数节点，生成静态根节点的渲染函数
    if (options.optimize !== false) {
      optimize(ast, options);
    }
    // 代码生成阶段
    // 从 AST 生成渲染函数
    var code = generate(ast, options);
    return {
      // 抽象语法树
      ast: ast,
      // 渲染函数
      render: code.render,
      // 静态渲染函数
      staticRenderFns: code.staticRenderFns
    }
  });

  /*  */

  var ref$1 = createCompiler(baseOptions);
  var compileToFunctions = ref$1.compileToFunctions;

  /*  */

  // check whether current browser encodes a char inside attribute values
  var div;
  function getShouldDecode (href) {
    div = div || document.createElement('div');
    div.innerHTML = href ? "<a href=\"\n\"/>" : "<div a=\"\n\"/>";
    return div.innerHTML.indexOf('&#10;') > 0
  }

  // #3663: IE encodes newlines inside attribute values while other browsers don't
  var shouldDecodeNewlines = inBrowser ? getShouldDecode(false) : false;
  // #6828: chrome encodes content in a[href]
  var shouldDecodeNewlinesForHref = inBrowser ? getShouldDecode(true) : false;

  /*  */

  var idToTemplate = cached(function (id) {
    var el = query(id);
    return el && el.innerHTML
  });

  /**
   * 编译器入口
   * 运行时的 Vue.js 包就没有这部分代码，通过 打包器 结合 vue-loader + vue-compiler-utils 进行预编译，将模板编译成 render 函数
   * 
   * 得到组件的渲染函数，将其设置到 this.$options 上
  */
  // $mount，做备份
  var mount = Vue.prototype.$mount;
  // 覆写 $mount
  Vue.prototype.$mount = function (
    el,
    hydrating
  ) {
    // 得到挂载点
    el = el && query(el);

    /* istanbul ignore if */
    // 挂载点不能是 body 或 html
    if (el === document.body || el === document.documentElement) {
       warn(
        "Do not mount Vue to <html> or <body> - mount to normal elements instead."
      );
      return this
    }

    // 配置选项
    var options = this.$options;
    // resolve template/el and convert to render function
    /**
     * 如果用户提供 render 配置项，则直接跳过编译阶段，否则进入编译阶段
     *   解析 template 和 el，并转换为 render 函数
     *   优先级： render > template > el
     * {
     *    render: () => {}
     * }
    */
    if (!options.render) {
      //  处理 template 选项
      var template = options.template;
      if (template) {
        if (typeof template === 'string') {
          if (template.charAt(0) === '#') {
            // { template: '#app' }，template 是一个 id 选择器，则获取该元素的 innerHtml
            template = idToTemplate(template);
            /* istanbul ignore if */
            if ( !template) {
              warn(
                ("Template element not found or is empty: " + (options.template)),
                this
              );
            }
          }
        } else if (template.nodeType) {
          // template 是一个正常的元素，获取其 innerHtml 作为模板
          template = template.innerHTML;
        } else {
          {
            warn('invalid template option:' + template, this);
          }
          return this
        }
      } else if (el) {
        // 设置 el 选项，获取 el 选择器的 outerHTML 作为模板
        template = getOuterHTML(el);
      }
      if (template) {
        // 模板就绪，进入编译阶段
        /* istanbul ignore if */
        if ( config.performance && mark) {
          mark('compile');
        }

        // 编译模板，得到 动态渲染函数 和 静态渲染函数
        var ref = compileToFunctions(template, {
          // 在非生产环境下，编译时记录 标签属性 在模板字符串中开始和结束的位置索引
          outputSourceRange: "development" !== 'production',
          shouldDecodeNewlines: shouldDecodeNewlines,
          shouldDecodeNewlinesForHref: shouldDecodeNewlinesForHref,
          // 界定符，默认 {{}}
          delimiters: options.delimiters,
          // 是否保留注释
          comments: options.comments
        }, this);
        var render = ref.render;
        var staticRenderFns = ref.staticRenderFns;
        // 将两个渲染函数放到 this.$options 上
        options.render = render;
        options.staticRenderFns = staticRenderFns;

        /* istanbul ignore if */
        if ( config.performance && mark) {
          mark('compile end');
          measure(("vue " + (this._name) + " compile"), 'compile', 'compile end');
        }
      }
    }
    // 执行挂载
    return mount.call(this, el, hydrating)
  };

  /**
   * Get outerHTML of elements, taking care
   * of SVG elements in IE as well.
   */
  function getOuterHTML (el) {
    if (el.outerHTML) {
      return el.outerHTML
    } else {
      var container = document.createElement('div');
      container.appendChild(el.cloneNode(true));
      return container.innerHTML
    }
  }

  Vue.compile = compileToFunctions;

  return Vue;

})));
//# sourceMappingURL=vue.js.map
