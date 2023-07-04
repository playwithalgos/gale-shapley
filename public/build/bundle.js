
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element.sheet;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
        return style.sheet;
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }
    class HtmlTag {
        constructor(is_svg = false) {
            this.is_svg = false;
            this.is_svg = is_svg;
            this.e = this.n = null;
        }
        c(html) {
            this.h(html);
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                if (this.is_svg)
                    this.e = svg_element(target.nodeName);
                /** #7364  target for <template> may be provided as #document-fragment(11) */
                else
                    this.e = element((target.nodeType === 11 ? 'TEMPLATE' : target.nodeName));
                this.t = target.tagName !== 'TEMPLATE' ? target : target.content;
                this.c(html);
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.nodeName === 'TEMPLATE' ? this.e.content.childNodes : this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    const managed_styles = new Map();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_style_information(doc, node) {
        const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
        managed_styles.set(doc, info);
        return info;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
        if (!rules[name]) {
            rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            managed_styles.forEach(info => {
                const { ownerNode } = info.stylesheet;
                // there is no ownerNode if it runs on jsdom.
                if (ownerNode)
                    detach(ownerNode);
            });
            managed_styles.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        const options = { direction: 'both' };
        let config = fn(node, params, options);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = (program.b - t);
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config(options);
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        const updates = [];
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                // defer updates until all the DOM shuffling is done
                updates.push(() => block.p(child_ctx, dirty));
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        run_all(updates);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.1' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function cubicInOut(t) {
        return t < 0.5 ? 4.0 * t * t * t : 0.5 * Math.pow(2.0 * t - 2.0, 3.0) + 1.0;
    }

    function draw(node, { delay = 0, speed, duration, easing = cubicInOut } = {}) {
        let len = node.getTotalLength();
        const style = getComputedStyle(node);
        if (style.strokeLinecap !== 'butt') {
            len += parseInt(style.strokeWidth);
        }
        if (duration === undefined) {
            if (speed === undefined) {
                duration = 800;
            }
            else {
                duration = len / speed;
            }
        }
        else if (typeof duration === 'function') {
            duration = duration(len);
        }
        return {
            delay,
            duration,
            easing,
            css: (_, u) => `
			stroke-dasharray: ${len};
			stroke-dashoffset: ${u * len};
		`
        };
    }

    /* src/App.svelte generated by Svelte v3.59.1 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	child_ctx[22] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	child_ctx[25] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[26] = list[i];
    	child_ctx[23] = i;
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[22] = list[i];
    	child_ctx[25] = i;
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[22] = list[i];
    	child_ctx[23] = i;
    	return child_ctx;
    }

    function get_each_context_5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[22] = list[i];
    	child_ctx[23] = i;
    	return child_ctx;
    }

    // (138:3) {#if b >= 0}
    function create_if_block_1(ctx) {
    	let line;
    	let line_y__value_1;
    	let line_transition;
    	let current;

    	const block = {
    		c: function create() {
    			line = svg_element("line");
    			attr_dev(line, "x1", "300");
    			attr_dev(line, "x2", "370");
    			attr_dev(line, "y1", 64 + /*a*/ ctx[23] * 70);
    			attr_dev(line, "y2", line_y__value_1 = 64 + /*b*/ ctx[22] * 70);
    			attr_dev(line, "fill", "none");
    			attr_dev(line, "stroke", "red");
    			attr_dev(line, "stroke-width", "2px");
    			add_location(line, file, 138, 4, 7280);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, line, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*matching*/ 1 && line_y__value_1 !== (line_y__value_1 = 64 + /*b*/ ctx[22] * 70)) {
    				attr_dev(line, "y2", line_y__value_1);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!current) return;
    				if (!line_transition) line_transition = create_bidirectional_transition(line, draw, { duration: 500 }, true);
    				line_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!line_transition) line_transition = create_bidirectional_transition(line, draw, { duration: 500 }, false);
    			line_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(line);
    			if (detaching && line_transition) line_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(138:3) {#if b >= 0}",
    		ctx
    	});

    	return block;
    }

    // (137:2) {#each matching as b, a}
    function create_each_block_5(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*b*/ ctx[22] >= 0 && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*b*/ ctx[22] >= 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*matching*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_5.name,
    		type: "each",
    		source: "(137:2) {#each matching as b, a}",
    		ctx
    	});

    	return block;
    }

    // (152:3) {#if b >= 0}
    function create_if_block(ctx) {
    	let line;
    	let line_y__value_1;
    	let line_transition;
    	let current;

    	const block = {
    		c: function create() {
    			line = svg_element("line");
    			attr_dev(line, "x1", "300");
    			attr_dev(line, "x2", "370");
    			attr_dev(line, "y1", 64 + /*a*/ ctx[23] * 70);
    			attr_dev(line, "y2", line_y__value_1 = 64 + /*b*/ ctx[22] * 70);
    			attr_dev(line, "fill", "none");
    			attr_dev(line, "stroke", "red");
    			attr_dev(line, "stroke-dasharray", "4");
    			attr_dev(line, "stroke-width", "1px");
    			add_location(line, file, 152, 4, 7536);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, line, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*instaMatching*/ 16 && line_y__value_1 !== (line_y__value_1 = 64 + /*b*/ ctx[22] * 70)) {
    				attr_dev(line, "y2", line_y__value_1);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!current) return;
    				if (!line_transition) line_transition = create_bidirectional_transition(line, draw, { duration: 500 }, true);
    				line_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!line_transition) line_transition = create_bidirectional_transition(line, draw, { duration: 500 }, false);
    			line_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(line);
    			if (detaching && line_transition) line_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(152:3) {#if b >= 0}",
    		ctx
    	});

    	return block;
    }

    // (151:2) {#each instaMatching as b, a}
    function create_each_block_4(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*b*/ ctx[22] >= 0 && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*b*/ ctx[22] >= 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*instaMatching*/ 16) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(151:2) {#each instaMatching as b, a}",
    		ctx
    	});

    	return block;
    }

    // (176:5) {#each aPref as b, i (b)}
    function create_each_block_3(key_1, ctx) {
    	let div;
    	let t0_value = th(/*i*/ ctx[25] + 1) + "";
    	let t0;
    	let html_tag;
    	let raw_value = /*agentBimg*/ ctx[9](/*b*/ ctx[22]) + "";
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[13](/*a*/ ctx[23], /*b*/ ctx[22]);
    	}

    	function mouseenter_handler() {
    		return /*mouseenter_handler*/ ctx[14](/*b*/ ctx[22]);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			html_tag = new HtmlTag(false);
    			t1 = space();
    			html_tag.a = t1;
    			attr_dev(div, "class", "agent agentB svelte-2hxq4s");
    			toggle_class(div, "current", /*currentA*/ ctx[3] == /*a*/ ctx[23] && /*currentB*/ ctx[2] == /*b*/ ctx[22]);
    			toggle_class(div, "married", /*matching*/ ctx[0][/*a*/ ctx[23]] == /*b*/ ctx[22]);
    			toggle_class(div, "unavailable", /*next*/ ctx[1][/*a*/ ctx[23]] > /*i*/ ctx[25]);
    			add_location(div, file, 176, 6, 8012);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			html_tag.m(raw_value, div);
    			append_dev(div, t1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div, "click", click_handler, false, false, false, false),
    					listen_dev(div, "mouseenter", mouseenter_handler, false, false, false, false),
    					listen_dev(div, "mouseleave", /*mouseleave_handler*/ ctx[15], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*currentA, aPrefs, currentB*/ 44) {
    				toggle_class(div, "current", /*currentA*/ ctx[3] == /*a*/ ctx[23] && /*currentB*/ ctx[2] == /*b*/ ctx[22]);
    			}

    			if (dirty & /*matching, aPrefs*/ 33) {
    				toggle_class(div, "married", /*matching*/ ctx[0][/*a*/ ctx[23]] == /*b*/ ctx[22]);
    			}

    			if (dirty & /*next, aPrefs*/ 34) {
    				toggle_class(div, "unavailable", /*next*/ ctx[1][/*a*/ ctx[23]] > /*i*/ ctx[25]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(176:5) {#each aPref as b, i (b)}",
    		ctx
    	});

    	return block;
    }

    // (169:2) {#each aPrefs as aPref, a (aPref)}
    function create_each_block_2(key_1, ctx) {
    	let div2;
    	let div0;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t0;
    	let div1;
    	let raw_value = /*agentAimg*/ ctx[8](/*a*/ ctx[23]) + "";
    	let t1;
    	let mounted;
    	let dispose;
    	let each_value_3 = /*aPref*/ ctx[26];
    	validate_each_argument(each_value_3);
    	const get_key = ctx => /*b*/ ctx[22];
    	validate_each_keys(ctx, each_value_3, get_each_context_3, get_key);

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		let child_ctx = get_each_context_3(ctx, each_value_3, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_3(key, child_ctx));
    	}

    	function mouseenter_handler_1() {
    		return /*mouseenter_handler_1*/ ctx[16](/*a*/ ctx[23]);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = text("\n\t\t\t\to o o\n\t\t\t\t");
    			div1 = element("div");
    			t1 = space();
    			attr_dev(div0, "class", "pref svelte-2hxq4s");
    			add_location(div0, file, 174, 4, 7956);
    			attr_dev(div1, "class", "agent agentA svelte-2hxq4s");
    			toggle_class(div1, "married", /*matching*/ ctx[0][/*a*/ ctx[23]] >= 0);
    			toggle_class(div1, "current", /*currentA*/ ctx[3] == /*a*/ ctx[23]);
    			add_location(div1, file, 190, 4, 8404);
    			attr_dev(div2, "class", "agentPref svelte-2hxq4s");
    			add_location(div2, file, 169, 3, 7837);
    			this.first = div2;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div0, null);
    				}
    			}

    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			div1.innerHTML = raw_value;
    			append_dev(div2, t1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div2, "mouseenter", mouseenter_handler_1, false, false, false, false),
    					listen_dev(div2, "mouseleave", /*mouseleave_handler_1*/ ctx[17], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*currentA, aPrefs, currentB, matching, next, tryMarry, agentBimg, th*/ 1583) {
    				each_value_3 = /*aPref*/ ctx[26];
    				validate_each_argument(each_value_3);
    				validate_each_keys(ctx, each_value_3, get_each_context_3, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_3, each_1_lookup, div0, destroy_block, create_each_block_3, null, get_each_context_3);
    			}

    			if (dirty & /*matching, aPrefs*/ 33) {
    				toggle_class(div1, "married", /*matching*/ ctx[0][/*a*/ ctx[23]] >= 0);
    			}

    			if (dirty & /*currentA, aPrefs*/ 40) {
    				toggle_class(div1, "current", /*currentA*/ ctx[3] == /*a*/ ctx[23]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(169:2) {#each aPrefs as aPref, a (aPref)}",
    		ctx
    	});

    	return block;
    }

    // (215:5) {#each bPref as a, i (a)}
    function create_each_block_1(key_1, ctx) {
    	let div;
    	let t0_value = th(/*i*/ ctx[25] + 1) + "";
    	let t0;
    	let html_tag;
    	let raw_value = /*agentAimg*/ ctx[8](/*a*/ ctx[23]) + "";
    	let t1;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			html_tag = new HtmlTag(false);
    			t1 = space();
    			html_tag.a = t1;
    			attr_dev(div, "class", "agent agentA svelte-2hxq4s");
    			toggle_class(div, "happy", /*isHappy*/ ctx[7]() && /*currentA*/ ctx[3] == /*a*/ ctx[23] && /*currentB*/ ctx[2] == /*b*/ ctx[22]);
    			toggle_class(div, "current", /*currentA*/ ctx[3] == /*a*/ ctx[23] && /*currentB*/ ctx[2] == /*b*/ ctx[22]);
    			toggle_class(div, "married", getBPartner(/*matching*/ ctx[0], /*b*/ ctx[22]) == /*a*/ ctx[23]);

    			toggle_class(div, "unavailable", !isBMarried(/*matching*/ ctx[0], /*b*/ ctx[22])
    			? false
    			: /*bPref*/ ctx[20].indexOf(getBPartner(/*matching*/ ctx[0], /*b*/ ctx[22])) < /*bPref*/ ctx[20].indexOf(/*a*/ ctx[23]));

    			add_location(div, file, 215, 6, 8940);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			html_tag.m(raw_value, div);
    			append_dev(div, t1);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*isHappy, currentA, bPrefs, currentB*/ 204) {
    				toggle_class(div, "happy", /*isHappy*/ ctx[7]() && /*currentA*/ ctx[3] == /*a*/ ctx[23] && /*currentB*/ ctx[2] == /*b*/ ctx[22]);
    			}

    			if (dirty & /*currentA, bPrefs, currentB*/ 76) {
    				toggle_class(div, "current", /*currentA*/ ctx[3] == /*a*/ ctx[23] && /*currentB*/ ctx[2] == /*b*/ ctx[22]);
    			}

    			if (dirty & /*getBPartner, matching, bPrefs*/ 65) {
    				toggle_class(div, "married", getBPartner(/*matching*/ ctx[0], /*b*/ ctx[22]) == /*a*/ ctx[23]);
    			}

    			if (dirty & /*isBMarried, matching, bPrefs, getBPartner*/ 65) {
    				toggle_class(div, "unavailable", !isBMarried(/*matching*/ ctx[0], /*b*/ ctx[22])
    				? false
    				: /*bPref*/ ctx[20].indexOf(getBPartner(/*matching*/ ctx[0], /*b*/ ctx[22])) < /*bPref*/ ctx[20].indexOf(/*a*/ ctx[23]));
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(215:5) {#each bPref as a, i (a)}",
    		ctx
    	});

    	return block;
    }

    // (203:2) {#each bPrefs as bPref, b (bPref)}
    function create_each_block(key_1, ctx) {
    	let div2;
    	let div0;
    	let raw_value = /*agentBimg*/ ctx[9](/*b*/ ctx[22]) + "";
    	let t0;
    	let div1;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t1;
    	let each_value_1 = /*bPref*/ ctx[20];
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*a*/ ctx[23];
    	validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1(key, child_ctx));
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t0 = text("\n\t\t\t\to o o\n\t\t\t\t");
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			attr_dev(div0, "class", "agent agentB svelte-2hxq4s");
    			toggle_class(div0, "happy", /*isHappy*/ ctx[7]() && /*currentB*/ ctx[2] == /*b*/ ctx[22]);
    			toggle_class(div0, "married", isBMarried(/*matching*/ ctx[0], /*b*/ ctx[22]));
    			toggle_class(div0, "current", /*currentB*/ ctx[2] == /*b*/ ctx[22]);
    			add_location(div0, file, 204, 4, 8670);
    			attr_dev(div1, "class", "pref svelte-2hxq4s");
    			add_location(div1, file, 213, 4, 8884);
    			attr_dev(div2, "class", "agentPref svelte-2hxq4s");
    			add_location(div2, file, 203, 3, 8642);
    			this.first = div2;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			div0.innerHTML = raw_value;
    			append_dev(div2, t0);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div1, null);
    				}
    			}

    			append_dev(div2, t1);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*isHappy, currentB, bPrefs*/ 196) {
    				toggle_class(div0, "happy", /*isHappy*/ ctx[7]() && /*currentB*/ ctx[2] == /*b*/ ctx[22]);
    			}

    			if (dirty & /*isBMarried, matching, bPrefs*/ 65) {
    				toggle_class(div0, "married", isBMarried(/*matching*/ ctx[0], /*b*/ ctx[22]));
    			}

    			if (dirty & /*currentB, bPrefs*/ 68) {
    				toggle_class(div0, "current", /*currentB*/ ctx[2] == /*b*/ ctx[22]);
    			}

    			if (dirty & /*isHappy, currentA, bPrefs, currentB, getBPartner, matching, isBMarried, agentAimg, th*/ 461) {
    				each_value_1 = /*bPref*/ ctx[20];
    				validate_each_argument(each_value_1);
    				validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, div1, destroy_block, create_each_block_1, null, get_each_context_1);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(203:2) {#each bPrefs as bPref, b (bPref)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let h1;
    	let t5;
    	let svg;
    	let each0_anchor;
    	let t6;
    	let div0;
    	let each_blocks_1 = [];
    	let each2_lookup = new Map();
    	let t7;
    	let div1;
    	let each_blocks = [];
    	let each3_lookup = new Map();
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_5 = /*matching*/ ctx[0];
    	validate_each_argument(each_value_5);
    	let each_blocks_3 = [];

    	for (let i = 0; i < each_value_5.length; i += 1) {
    		each_blocks_3[i] = create_each_block_5(get_each_context_5(ctx, each_value_5, i));
    	}

    	const out = i => transition_out(each_blocks_3[i], 1, 1, () => {
    		each_blocks_3[i] = null;
    	});

    	let each_value_4 = /*instaMatching*/ ctx[4];
    	validate_each_argument(each_value_4);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks_2[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
    	}

    	const out_1 = i => transition_out(each_blocks_2[i], 1, 1, () => {
    		each_blocks_2[i] = null;
    	});

    	let each_value_2 = /*aPrefs*/ ctx[5];
    	validate_each_argument(each_value_2);
    	const get_key = ctx => /*aPref*/ ctx[26];
    	validate_each_keys(ctx, each_value_2, get_each_context_2, get_key);

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		let child_ctx = get_each_context_2(ctx, each_value_2, i);
    		let key = get_key(child_ctx);
    		each2_lookup.set(key, each_blocks_1[i] = create_each_block_2(key, child_ctx));
    	}

    	let each_value = /*bPrefs*/ ctx[6];
    	validate_each_argument(each_value);
    	const get_key_1 = ctx => /*bPref*/ ctx[20];
    	validate_each_keys(ctx, each_value, get_each_context, get_key_1);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key_1(child_ctx);
    		each3_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			button0 = element("button");
    			button0.textContent = "Reset";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "Show an instability";
    			t3 = space();
    			h1 = element("h1");
    			h1.textContent = "Gale-Shapley algorithm";
    			t5 = space();
    			svg = svg_element("svg");

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].c();
    			}

    			each0_anchor = empty();

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t6 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t7 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(button0, file, 131, 1, 7032);
    			add_location(button1, file, 132, 1, 7073);
    			attr_dev(h1, "class", "svelte-2hxq4s");
    			add_location(h1, file, 133, 1, 7138);
    			attr_dev(svg, "width", 1000);
    			attr_dev(svg, "height", 1000);
    			attr_dev(svg, "viewBox", "0 0 " + 1000 + " " + 1000);
    			attr_dev(svg, "class", "svelte-2hxq4s");
    			add_location(svg, file, 135, 1, 7172);
    			attr_dev(div0, "class", "family svelte-2hxq4s");
    			add_location(div0, file, 167, 1, 7776);
    			attr_dev(div1, "class", "family svelte-2hxq4s");
    			add_location(div1, file, 201, 1, 8581);
    			attr_dev(main, "class", "svelte-2hxq4s");
    			add_location(main, file, 130, 0, 7024);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, button0);
    			append_dev(main, t1);
    			append_dev(main, button1);
    			append_dev(main, t3);
    			append_dev(main, h1);
    			append_dev(main, t5);
    			append_dev(main, svg);

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				if (each_blocks_3[i]) {
    					each_blocks_3[i].m(svg, null);
    				}
    			}

    			append_dev(svg, each0_anchor);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				if (each_blocks_2[i]) {
    					each_blocks_2[i].m(svg, null);
    				}
    			}

    			append_dev(main, t6);
    			append_dev(main, div0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				if (each_blocks_1[i]) {
    					each_blocks_1[i].m(div0, null);
    				}
    			}

    			append_dev(main, t7);
    			append_dev(main, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div1, null);
    				}
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*reset*/ ctx[11], false, false, false, false),
    					listen_dev(button1, "click", /*showInstability*/ ctx[12], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*matching*/ 1) {
    				each_value_5 = /*matching*/ ctx[0];
    				validate_each_argument(each_value_5);
    				let i;

    				for (i = 0; i < each_value_5.length; i += 1) {
    					const child_ctx = get_each_context_5(ctx, each_value_5, i);

    					if (each_blocks_3[i]) {
    						each_blocks_3[i].p(child_ctx, dirty);
    						transition_in(each_blocks_3[i], 1);
    					} else {
    						each_blocks_3[i] = create_each_block_5(child_ctx);
    						each_blocks_3[i].c();
    						transition_in(each_blocks_3[i], 1);
    						each_blocks_3[i].m(svg, each0_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_5.length; i < each_blocks_3.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (dirty & /*instaMatching*/ 16) {
    				each_value_4 = /*instaMatching*/ ctx[4];
    				validate_each_argument(each_value_4);
    				let i;

    				for (i = 0; i < each_value_4.length; i += 1) {
    					const child_ctx = get_each_context_4(ctx, each_value_4, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    						transition_in(each_blocks_2[i], 1);
    					} else {
    						each_blocks_2[i] = create_each_block_4(child_ctx);
    						each_blocks_2[i].c();
    						transition_in(each_blocks_2[i], 1);
    						each_blocks_2[i].m(svg, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_4.length; i < each_blocks_2.length; i += 1) {
    					out_1(i);
    				}

    				check_outros();
    			}

    			if (dirty & /*currentA, aPrefs, matching, agentAimg, currentB, next, tryMarry, agentBimg, th*/ 1839) {
    				each_value_2 = /*aPrefs*/ ctx[5];
    				validate_each_argument(each_value_2);
    				validate_each_keys(ctx, each_value_2, get_each_context_2, get_key);
    				each_blocks_1 = update_keyed_each(each_blocks_1, dirty, get_key, 1, ctx, each_value_2, each2_lookup, div0, destroy_block, create_each_block_2, null, get_each_context_2);
    			}

    			if (dirty & /*bPrefs, isHappy, currentA, currentB, getBPartner, matching, isBMarried, agentAimg, th, agentBimg*/ 973) {
    				each_value = /*bPrefs*/ ctx[6];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context, get_key_1);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key_1, 1, ctx, each_value, each3_lookup, div1, destroy_block, create_each_block, null, get_each_context);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_5.length; i += 1) {
    				transition_in(each_blocks_3[i]);
    			}

    			for (let i = 0; i < each_value_4.length; i += 1) {
    				transition_in(each_blocks_2[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks_3 = each_blocks_3.filter(Boolean);

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				transition_out(each_blocks_3[i]);
    			}

    			each_blocks_2 = each_blocks_2.filter(Boolean);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				transition_out(each_blocks_2[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks_3, detaching);
    			destroy_each(each_blocks_2, detaching);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].d();
    			}

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const n = 5;

    function randomArray(n) {
    	const A = new Array(n).fill(0).map((v, i) => i);

    	for (let i = n - 1; i >= 0; i--) {
    		const j = Math.floor(Math.random() * i);
    		[A[i], A[j]] = [A[j], A[i]];
    	}

    	console.log(A);
    	return A;
    }

    function beep() {
    	const snd = new Audio("data:audio/wav;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAGDgYtAgAyN+QWaAAihwMWm4G8QQRDiMcCBcH3Cc+CDv/7xA4Tvh9Rz/y8QADBwMWgQAZG/ILNAARQ4GLTcDeIIIhxGOBAuD7hOfBB3/94gcJ3w+o5/5eIAIAAAVwWgQAVQ2ORaIQwEMAJiDg95G4nQL7mQVWI6GwRcfsZAcsKkJvxgxEjzFUgfHoSQ9Qq7KNwqHwuB13MA4a1q/DmBrHgPcmjiGoh//EwC5nGPEmS4RcfkVKOhJf+WOgoxJclFz3kgn//dBA+ya1GhurNn8zb//9NNutNuhz31f////9vt///z+IdAEAAAK4LQIAKobHItEIYCGAExBwe8jcToF9zIKrEdDYIuP2MgOWFSE34wYiR5iqQPj0JIeoVdlG4VD4XA67mAcNa1fhzA1jwHuTRxDUQ//iYBczjHiTJcIuPyKlHQkv/LHQUYkuSi57yQT//uggfZNajQ3Vmz+Zt//+mm3Wm3Q576v////+32///5/EOgAAADVghQAAAAA//uQZAUAB1WI0PZugAAAAAoQwAAAEk3nRd2qAAAAACiDgAAAAAAABCqEEQRLCgwpBGMlJkIz8jKhGvj4k6jzRnqasNKIeoh5gI7BJaC1A1AoNBjJgbyApVS4IDlZgDU5WUAxEKDNmmALHzZp0Fkz1FMTmGFl1FMEyodIavcCAUHDWrKAIA4aa2oCgILEBupZgHvAhEBcZ6joQBxS76AgccrFlczBvKLC0QI2cBoCFvfTDAo7eoOQInqDPBtvrDEZBNYN5xwNwxQRfw8ZQ5wQVLvO8OYU+mHvFLlDh05Mdg7BT6YrRPpCBznMB2r//xKJjyyOh+cImr2/4doscwD6neZjuZR4AgAABYAAAABy1xcdQtxYBYYZdifkUDgzzXaXn98Z0oi9ILU5mBjFANmRwlVJ3/6jYDAmxaiDG3/6xjQQCCKkRb/6kg/wW+kSJ5//rLobkLSiKmqP/0ikJuDaSaSf/6JiLYLEYnW/+kXg1WRVJL/9EmQ1YZIsv/6Qzwy5qk7/+tEU0nkls3/zIUMPKNX/6yZLf+kFgAfgGyLFAUwY//uQZAUABcd5UiNPVXAAAApAAAAAE0VZQKw9ISAAACgAAAAAVQIygIElVrFkBS+Jhi+EAuu+lKAkYUEIsmEAEoMeDmCETMvfSHTGkF5RWH7kz/ESHWPAq/kcCRhqBtMdokPdM7vil7RG98A2sc7zO6ZvTdM7pmOUAZTnJW+NXxqmd41dqJ6mLTXxrPpnV8avaIf5SvL7pndPvPpndJR9Kuu8fePvuiuhorgWjp7Mf/PRjxcFCPDkW31srioCExivv9lcwKEaHsf/7ow2Fl1T/9RkXgEhYElAoCLFtMArxwivDJJ+bR1HTKJdlEoTELCIqgEwVGSQ+hIm0NbK8WXcTEI0UPoa2NbG4y2K00JEWbZavJXkYaqo9CRHS55FcZTjKEk3NKoCYUnSQ0rWxrZbFKbKIhOKPZe1cJKzZSaQrIyULHDZmV5K4xySsDRKWOruanGtjLJXFEmwaIbDLX0hIPBUQPVFVkQkDoUNfSoDgQGKPekoxeGzA4DUvnn4bxzcZrtJyipKfPNy5w+9lnXwgqsiyHNeSVpemw4bWb9psYeq//uQZBoABQt4yMVxYAIAAAkQoAAAHvYpL5m6AAgAACXDAAAAD59jblTirQe9upFsmZbpMudy7Lz1X1DYsxOOSWpfPqNX2WqktK0DMvuGwlbNj44TleLPQ+Gsfb+GOWOKJoIrWb3cIMeeON6lz2umTqMXV8Mj30yWPpjoSa9ujK8SyeJP5y5mOW1D6hvLepeveEAEDo0mgCRClOEgANv3B9a6fikgUSu/DmAMATrGx7nng5p5iimPNZsfQLYB2sDLIkzRKZOHGAaUyDcpFBSLG9MCQALgAIgQs2YunOszLSAyQYPVC2YdGGeHD2dTdJk1pAHGAWDjnkcLKFymS3RQZTInzySoBwMG0QueC3gMsCEYxUqlrcxK6k1LQQcsmyYeQPdC2YfuGPASCBkcVMQQqpVJshui1tkXQJQV0OXGAZMXSOEEBRirXbVRQW7ugq7IM7rPWSZyDlM3IuNEkxzCOJ0ny2ThNkyRai1b6ev//3dzNGzNb//4uAvHT5sURcZCFcuKLhOFs8mLAAEAt4UWAAIABAAAAAB4qbHo0tIjVkUU//uQZAwABfSFz3ZqQAAAAAngwAAAE1HjMp2qAAAAACZDgAAAD5UkTE1UgZEUExqYynN1qZvqIOREEFmBcJQkwdxiFtw0qEOkGYfRDifBui9MQg4QAHAqWtAWHoCxu1Yf4VfWLPIM2mHDFsbQEVGwyqQoQcwnfHeIkNt9YnkiaS1oizycqJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");
    	snd.play();
    }

    function getBPartner(matching, b) {
    	return matching.indexOf(b);
    }

    function isAMarried(matching, a) {
    	return matching[a] != -1;
    }

    function isBMarried(matching, b) {
    	return getBPartner(matching, b) >= 0;
    }

    function th(n) {
    	if (n == 1) return "1st";
    	if (n == 2) return "2nd";
    	return n + "th";
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let aPrefs = new Array(n).fill(0).map(() => randomArray(n));
    	let bPrefs = new Array(n).fill(0).map(() => randomArray(n));
    	beep();
    	let matching = new Array(n).fill(-1); // matching[a] = -1 if a is single and = its partner b otherwise
    	let next = new Array(n).fill(0);
    	let currentB = -1;
    	let currentA = -1;
    	let instaMatching = [];

    	function isHappy() {
    		if (currentA < 0) return false;
    		if (currentB < 0) return false;
    		const a = currentA;
    		const b = currentB;
    		const a1 = getBPartner(matching, b);
    		if (a1 == -1) return true;
    		return bPrefs[b].indexOf(a) < bPrefs[b].indexOf(a1);
    	}

    	let iImages = 1;

    	const images = [
    		[
    			["1F43C", "1F431", "1F437", "1F42E", "1F43B"],
    			["1F996", "1F438", "1F424", "1F414", "1F997"]
    		],
    		[
    			["1F43C", "1F431", "1F437", "1F42E", "1F43B"],
    			["1F3EB", "1F3DB", "1F3EC", "1F3E1", "1F3F0"]
    		]
    	];

    	function agentAimg(a) {
    		return `<img src='https://openmoji.org/data/color/svg/${images[iImages][0][a]}.svg'/>`;
    	}

    	function agentBimg(b) {
    		return `<img src='https://openmoji.org/data/color/svg/${images[iImages][1][b]}.svg'/>`;
    	}

    	function tryMarry(a, b) {
    		if (isAMarried(matching, a) || b != aPrefs[a][next[a]]) {
    			console.log(matching[a]);
    			beep();
    			return;
    		}

    		$$invalidate(1, next[a]++, next);
    		const a1 = getBPartner(matching, b);

    		if (a1 == -1) $$invalidate(0, matching[a] = b, matching); else if (bPrefs[b].indexOf(a) < bPrefs[b].indexOf(a1)) {
    			$$invalidate(0, matching[a] = b, matching);
    			$$invalidate(0, matching[a1] = -1, matching);
    		}

    		$$invalidate(0, matching);
    		$$invalidate(1, next);
    	}

    	function reset() {
    		$$invalidate(0, matching = new Array(n).fill(-1)); // matching[a] = -1 if a is single and = its partner b otherwise
    		$$invalidate(1, next = new Array(n).fill(0));
    		$$invalidate(2, currentB = -1);
    		$$invalidate(3, currentA = -1);
    		$$invalidate(4, instaMatching = []);
    	}

    	function showInstability() {
    		reset();

    		for (let a = 0; a < aPrefs.length; a++) for (let b = 0; b < aPrefs.length; b++) for (let a2 = 0; a2 < aPrefs.length; a2++) for (let b2 = 0; b2 < aPrefs.length; b2++) {
    			console.log(aPrefs[a].indexOf(parseInt(b2)));

    			if (aPrefs[a].indexOf(b2) < aPrefs[a].indexOf(b) && aPrefs[b2].indexOf(a) < aPrefs[b2].indexOf(a2)) {
    				$$invalidate(0, matching[a] = b, matching);
    				$$invalidate(0, matching[a2] = b2, matching);
    				$$invalidate(0, matching);
    				$$invalidate(4, instaMatching[a] = b2, instaMatching);
    				return;
    			}
    		}
    	}

    	reset();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = (a, b) => tryMarry(a, b);
    	const mouseenter_handler = b => $$invalidate(2, currentB = b);
    	const mouseleave_handler = () => $$invalidate(2, currentB = -1);
    	const mouseenter_handler_1 = a => $$invalidate(3, currentA = a);
    	const mouseleave_handler_1 = () => $$invalidate(3, currentA = -1);

    	$$self.$capture_state = () => ({
    		draw,
    		n,
    		randomArray,
    		aPrefs,
    		bPrefs,
    		beep,
    		matching,
    		next,
    		currentB,
    		currentA,
    		instaMatching,
    		isHappy,
    		iImages,
    		images,
    		agentAimg,
    		agentBimg,
    		getBPartner,
    		isAMarried,
    		isBMarried,
    		tryMarry,
    		th,
    		reset,
    		showInstability
    	});

    	$$self.$inject_state = $$props => {
    		if ('aPrefs' in $$props) $$invalidate(5, aPrefs = $$props.aPrefs);
    		if ('bPrefs' in $$props) $$invalidate(6, bPrefs = $$props.bPrefs);
    		if ('matching' in $$props) $$invalidate(0, matching = $$props.matching);
    		if ('next' in $$props) $$invalidate(1, next = $$props.next);
    		if ('currentB' in $$props) $$invalidate(2, currentB = $$props.currentB);
    		if ('currentA' in $$props) $$invalidate(3, currentA = $$props.currentA);
    		if ('instaMatching' in $$props) $$invalidate(4, instaMatching = $$props.instaMatching);
    		if ('iImages' in $$props) iImages = $$props.iImages;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		matching,
    		next,
    		currentB,
    		currentA,
    		instaMatching,
    		aPrefs,
    		bPrefs,
    		isHappy,
    		agentAimg,
    		agentBimg,
    		tryMarry,
    		reset,
    		showInstability,
    		click_handler,
    		mouseenter_handler,
    		mouseleave_handler,
    		mouseenter_handler_1,
    		mouseleave_handler_1
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
