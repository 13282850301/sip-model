# sip-model
双向数据绑定的实现

## 劫持data 里的每个数据
  使用Object.defineProperty
  ````
   Object.defineProperty(data, key, {
          get() {
              Dep.target && dep.addWatcher(Dep.target);
              return value;
          },
          set(newVal) {
              if (value !== newVal) {
                  me.observer(newVal);
                  value = newVal;
                  dep.notify();
              }

          }
      })
   ````   
   
## 编译模板
  1.elementNode(元素节点 input) 监听sip-model 指令对应的数据 添加Watcher (订阅)，添加input事件
  ````
    function compileElement(node) {
        let attrs = node.attributes; //类数组
        // console.log(attrs);
        [...attrs].forEach(attr => {
            let { name, value } = attr;//name='sip-model' value="company.name"
            if (this.isDirective(name)) {
                let [, directive] = name.split('-');
                Util[directive](node, value, this.vm);
            }
        })
    }
   ````
  2.textNode(文本节点) 监听{{}} 对应的数据 添加Watcher (订阅)
  ````
   function compileText(node) {
        let content = node.textContent,
            reg = /\{\{(.+?)\}\}/;
        // console.log(content, reg.test(content))
        if (reg.test(content)) {
            Util['text'](node, content, this.vm);
        }
    }
  ````
  3.数据发生改变 执行 Watcher 里的callback（发布） 使视图发生改变
  ````
    set(newVal) {
        if (value !== newVal) {
            me.observer(newVal);
            value = newVal;
            dep.notify();//发布 更新视图
        }

    }
  ````
