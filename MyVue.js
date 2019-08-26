//编译指令的工具
Util = {
        //expr 表达式(company.name) 这里只是针对简单的input
        model(node, expr, vm) {
            node.value = this.getValue(expr, vm);
            //给输入框添加watcher,数据更新会触发
            new Watcher(vm, expr, (newValue) => {
                node.value = newValue;
            })
            node.addEventListener('input', e => {
                let val = e.target.value;
                this.setValue(expr, vm, val)
            })
        },
        //根据表达式 取 vm.$data里对应的s数据
        getValue(expr, vm) {
            let keys = expr.split('.'), //['company','name'];
                data = vm.$data,
                value = data;
            keys.forEach(key => {
                value = value[key];
            })
            return value;
        },
        //输入框改变 改变$data里对应的数据
        setValue(expr, vm, newValue) {
            let keys = expr.split('.'), //['company','name'];
                data = vm.$data;
            keys.forEach((key, index) => {
                if (index === keys.length - 1) {
                    data[key] = newValue;
                }
                data = data[key];
            })
        },
        ////{{company.name}} name 改变时 重新渲染 改变后的结果
        getContent(vm, expr) {
            let reg = /\{\{(.+?)\}\}/g,
                me = this;
            let content = expr.replace(reg, function() {
                return me.getValue(arguments[1], vm);
            })
            return content;
        },
        // 带{{}} 的文本节点
        text(node, expr, vm) { //expr: 公司:{{company.name}} 部门:{{company.department}}
            let reg = /\{\{(.+?)\}\}/g,
                me = this;
            //arguments[0]="{{company.name}}", arguments[1]="company.name"
            let content = expr.replace(reg, function() {
                // console.log(arguments);
                new Watcher(vm, arguments[1], (newValue) => {
                    node.textContent = me.getContent(vm, expr);
                })
                return me.getValue(arguments[1], vm);
            });
            node.textContent = content;

        }
    }
    //编辑模板
class Compile {
    constructor(el, vm) {
        this.el = this.isElementNode(el) ? el : document.querySelector(el);
        this.vm = vm;
        let fragment = this.node2Fragment(this.el);
        //编译模板 处理sip-mode 和 {{}}
        this.compile(fragment);
        this.el.appendChild(fragment);
    }
    isElementNode(node) {
            return node.nodeType === 1;
        }
        //
    node2Fragment(node) {
        let fragment = document.createDocumentFragment(this.$el);
        while (node.firstChild) {
            fragment.appendChild(node.firstChild);
        }
        return fragment;
    }
    compile(node) {
            let childNodes = node.childNodes;
            [...childNodes].forEach(child => {
                if (this.isElementNode(child)) {
                    this.compileElement(child);
                    //递归
                    this.compile(child);
                } else {
                    this.compileText(child);
                }
            })
        }
        //判断是否是指令
    isDirective(attrName) {
        return attrName.startsWith('sip-');
    }
    compileElement(node) {
        let attrs = node.attributes; //类数组
        // console.log(attrs);
        [...attrs].forEach(attr => {
            let { name, value } = attr;
            if (this.isDirective(name)) {
                let [, directive] = name.split('-');
                Util[directive](node, value, this.vm);
            }
        })
    }
    compileText(node) {
        let content = node.textContent,
            reg = /\{\{(.+?)\}\}/;
        // console.log(content, reg.test(content))
        if (reg.test(content)) {
            Util['text'](node, content, this.vm);
        }
    }
}
//实现数据劫持功能
class Observer {
    constructor(data) {
        this.observer(data)
    }
    observer(data) {
            if (data && typeof data === 'object') {
                for (let key in data) {
                    this.defineReactive(data, key, data[key]);
                }

            }
        }
        //使用Object.defineProperty 方法进行数据劫持
    defineReactive(data, key, value) {
        let me = this,
            dep = new Dep();
        //递归转换 data = {company:{name:'',department:''}};
        this.observer(value); //数据对象有多层
        Object.defineProperty(data, key, {
            get() {
                Dep.target && dep.addWatcher(Dep.target);
                return value;
            },
            set(newVal) {
                if (value !== newVal) {
                    me.observer(newVal); //重新赋值为对象 data.company = {name:'xxx',deparment:'xxx'};
                    value = newVal;
                    dep.notify();
                }

            }
        })
    }
}
class Dep {
    constructor() {
        this.watchers = []; // 存放所有的watcher
    }
    addWatcher(watcher) {
            this.watchers.push(watcher);
        }
        //数据改变 执行更新 发布
    notify() {
        this.watchers.forEach(watcher => {
            watcher.update();
        })
    }
}
//观察者 数据监听
class Watcher {
    //cb 绑定的更新函数 expr->'compnay.name';
    constructor(vm, expr, cb) {
        this.vm = vm;
        this.expr = expr;
        this.cb = cb;
        this.oldValue = this.get();
        Dep.target = null;
    }
    get() {
            Dep.target = this;
            return Util.getValue(this.expr, this.vm);
        }
        //更新视图
    update() {
        let newValue = Util.getValue(this.expr, this.vm);
        if (newValue !== this.oldValue) {
            this.oldValue = newValue;
            this.cb(newValue);
        }
    }
}

// vm.$watcher(vm,'company.name',newVal=>{
// })
//基类
class MyVue {
    constructor(options) {
        this.$el = options.el;
        this.$data = options.data;

        if (this.$el) {
            //把数据全部用Object.defineProperty来定义
            new Observer(this.$data);

            //编译模板
            new Compile(this.$el, this)
        }

    }
}
