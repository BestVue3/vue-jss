# vue-jss

<p>
  <a href="https://www.npmjs.com/package/vue"><img src="https://img.shields.io/npm/v/vue-jss.svg?sanitize=true" alt="Version"></a>
  <a href="https://www.npmjs.com/package/vue"><img src="https://img.shields.io/npm/l/vue-jss.svg?sanitize=true" alt="License"></a>
  <a href="https://www.npmjs.com/package/vue"><img src="https://img.shields.io/bundlephobia/minzip/vue-jss" alt="Size"></a>
  <a href="https://codecov.io/gh/pure-vue/vue-jss"><img src="https://img.shields.io/codecov/c/gh/pure-vue/vue-jss" alt="Coverage"></a>
  <a href="https://www.npmjs.com/package/vue"><img src="https://david-dm.org/pure-vue/vue-jss.svg" alt="Dependencies"></a>
</p>

vue-jss is fully tested css in js library for vue based on [jss](https://cssinjs.org/).

Thanks to the jss team, we can easily implement css in js in vue. Css in js is more powerful in:

- theming
- wrapper element or component
- reuse style fragment
- dynamic calculate some style
- easy to work with transition & animation (WIP)

We are aim to change the ecology of css management in vue.

# Install

```shell
# npm
npm i vue-jss -S

# or yarn
yarn add vue-jss -S
```

# Usage

### Basic

```js
import { defineComponent } from 'vue'
import { createUseStyles } from 'vue-jss'

// Create your Styles. Remember, since Vue-JSS uses the default preset,
// most plugins are available without further configuration needed.
const useStyles = createUseStyles({
  myButton: {
    color: 'green',
    margin: {
      // jss-plugin-expand gives more readable syntax
      top: 5, // jss-plugin-default-unit makes this 5px
      right: 0,
      bottom: 0,
      left: '1rem',
    },
    '& span': {
      // jss-plugin-nested applies this to a child span
      fontWeight: 'bold', // jss-plugin-camel-case turns this into 'font-weight'
    },
  },
  myLabel: {
    fontStyle: 'italic',
  },
})

// Define the component using these styles and pass it the 'classes' prop.
// Use this to assign scoped class names.
const Button = defineComponent({
  setup(p, { slots }) {
    const classes = useStyles()
    return () => (
      <button class={classes.myButton}>
        <span class={classes.myLabel}>{slots.default && slots.default()}</span>
      </button>
    )
  },
})

const App = () => <Button>Submit</Button>

render(<App />, document.getElementById('root'))
```

The above code will compile to

```html
<div id="root">
  <button class="Button-myButton-1-25">
    <span class="Button-myLabel-1-26">
      Submit
    </span>
  </button>
</div>
```

and

```css
.Button-myButton-1-25 {
  color: green;
  margin: 5px 0 0 1rem;
}
.Button-myButton-1-25 span {
  font-weight: bold;
}
.Button-myLabel-1-26 {
  font-style: italic;
}
```

### Dynamic values

You can use [function values](https://cssinjs.org/jss-syntax#function-values), Function rules and observables out of the box. Function values and function rules will receive a props object once the component receives new props or mounts for the first time.

Caveats:

Static properties being rendered first so that function values will have higher source order specificity.

```ts
import { defineComponent } from 'vue'
import { createUseStyles } from 'vue-jss'

const useStyles = createUseStyles({
  myButton: {
    padding: props => props.spacing,
  },
  myLabel: props => ({
    display: 'block',
    color: props.labelColor,
    fontWeight: props.fontWeight,
    fontStyle: props.fontStyle,
  }),
})

const Button = defineComponent({
  props: {
    spacing: {
      type: Number,
      default: 10,
    },
    fontWeight: {
      type: String,
      default: 'bold',
    },
    labelColor: {
      type: String,
      default: 'red',
    },
  },
  setup({ ...props }, { slots }) {
    const classes = useStyles(props)
    return () => (
      <button className={classes.myButton}>
        <span className={classes.myLabel}>
          {slots.default && slots.default()}
        </span>
      </button>
    )
  },
})

const App = () => <Button fontStyle="italic">Submit</Button>
```

The above code will compile to

```html
<div id="root">
  <button class="Button-myButton-1-25">
    <span class="Button-myLabel-1-26">
      Submit
    </span>
  </button>
</div>
```

and

```css
.Button-myButton-1-25 {
  padding: 10px;
}
.Button-myLabel-1-26 {
  display: block;
  color: red;
  font-weight: bold;
  font-style: italic;
}
```

**Note: if you want to update style dynamic, you should pass down reactive data. You can use `toRef` to turn an normal object into Ref**

### Theming

The idea is that you define a theme, wrap your application with ThemeProvider and pass the theme object to ThemeProvider. Later you can access theme in your styles creator function and using a useTheme() hook. After that, you may change your theme, and all your components will get the new theme automatically.

Usage of ThemeProvider:

- It has a theme prop which should be an object or function:
  - If it is an Object and used in a root ThemeProvider, then it's intact and being passed down the Vnode Tree.
  - If it is Object and used in a nested ThemeProvider, then it gets merged with the theme from a parent ThemeProvider and passed down the vnode tree.
  - If it is Function and used in a nested ThemeProvider, then it's being applied to the theme from a parent ThemeProvider. If the result is an Object it will be passed down the vnode tree, throws otherwise.
- ThemeProvider only renders `slots.default`.

```ts
import { defineComonent } from 'vue'
import { createUseStyles, useTheme, ThemeProvider } from 'vue-jss'

// Using `theme` function is better when you have many theme dependant styles.
let useStyles = createUseStyles(theme => ({
  button: {
    background: theme.colorPrimary,
  },
  label: {
    fontWeight: 'bold',
  },
}))

// Using function values might be better if you have only few theme dependant styles
// and also props or state is used for other values.
useStyles = createUseStyles({
  button: {
    background: ({ theme }) => theme.colorPrimary,
  },
  label: {
    fontWeight: 'bold',
  },
})

const Button = defineComponent({
  setup({ ...props }, { slots }) {
    const theme = useTheme()
    const classes = useStyles({ ...props, theme })
    return () => (
      <button className={classes.button}>
        <span className={classes.label}>
          {slots.default && slots.default()}
        </span>
      </button>
    )
  },
})

const theme = {
  colorPrimary: 'green',
}

const App = () => (
  <ThemeProvider theme={theme}>
    <Button>I am a button with green background</Button>
  </ThemeProvider>
)
```

# Using custom Theming Context

Use _namespaced_ themes so that a set of UI components gets no conflicts with another set of UI components from a different library also using vue-jss or in case you want to use the same theme from another context that is already used in your app.

```js
import { defineComponent } from 'vue'
import { createUseStyles, createTheming } from 'vue-jss'

const ThemeContext = Symbol()

// Creating a namespaced theming object.
const theming = createTheming(ThemeContext, defaultTheme)

// Note that `useTheme` here comes from the `theming` object, NOT from `vue-jss` import.
const { ThemeProvider, useTheme } = theming

const useStyles = createUseStyles(
  {
    button: {
      background: ({ theme }) => theme.colorPrimary,
    },
    // Passing theming object to `createUseStyles()`
  },
  { theming },
)

const myTheme = {
  colorPrimary: 'green',
}

const Button = defineComponent({
  setup({ ...props }, { slots }) {
    const theme = useTheme()
    const classes = useStyles({ ...props, theme })
    return (
      <button className={classes.button}>
        {slots.default && slots.default()}
      </button>
    )
  },
})

const OtherLibraryThemeProvider = () => null
const OtherLibraryComponent = () => null
const otherLibraryTheme = {}

// Using namespaced ThemeProviders - they can be nested in any order
const App = () => (
  <OtherLibraryThemeProvider theme={otherLibraryTheme}>
    <OtherLibraryComponent />
    <ThemeProvider theme={myTheme}>
      <Button>Green Button</Button>
    </ThemeProvider>
  </OtherLibraryThemeProvider>
)
```

# Class name generator options

Make sure using the same setup on the server and on the client. Id generator is used for class names and for keyframes.

1. You can change the class name generation algorithm by passing your custom generator function prop.

```js
import { JssProvider } from 'vue-jss'
import MyApp from './MyApp'

const generateId = (rule, sheet) => 'some-id'
const App = () => (
  <JssProvider generateId={generateId}>
    <MyApp />
  </JssProvider>
)
```

2. You can add an additional prefix to each class.
3. You can minify class names by passing id prop, so that prefixes a not used, [see also](https://cssinjs.org/jss-api#minify-selectors).

```js
import { JssProvider } from 'vue-jss'
import MyApp from './MyApp'

const App = () => (
  <JssProvider id={{ minify: true }}>
    <MyApp />
  </JssProvider>
)
```

# Server-side rendering

WIP

# Custom setup

If you want to specify a JSS version and plugins to use, you should create your own JSS instance, setup plugins and pass it to JssProvider.

```js
import { create as createJss } from 'jss'
import { JssProvider } from 'vue-jss'
import vendorPrefixer from 'jss-plugin-vendor-prefixer'

const jss = createJss()
jss.use(vendorPrefixer())

const App = () => null
const Component = () => (
  <JssProvider jss={jss}>
    <App />
  </JssProvider>
)
```

You can also access the default JSS instance.

```js
import { jss } from 'vue-jss'
```

# Multi-tree setup

In case you render multiple vue app in one application, you will get class name collisions because every JssProvider rerender will reset the class names generator. If you want to avoid this, you can share the class names generator between multiple JssProvider instances.

**Note**: in case of SSR, make sure to create a new generator for **each** request. Otherwise, class names will become indeterministic, and at some point, you may run out of max safe integer numbers.

```js
import { createGenerateId, JssProvider } from 'vue-jss'

const generateId = createGenerateId()
const App1 = () => null
const App2 = () => null

const Component = () => (
  <div>
    <JssProvider generateId={generateId}>
      <App1 />
    </JssProvider>
    <JssProvider generateId={generateId}>
      <App2 />
    </JssProvider>
  </div>
)
```

You can also additionally use the `classNamePrefix` prop to add the app/subtree name to each class name. This way you can see which app generated a class name in the DOM view.

```js
import { JssProvider } from 'vue-jss'

const App1 = () => null
const App2 = () => null

const Component = () => (
  <div>
    <JssProvider classNamePrefix="App1-">
      <App1 />
    </JssProvider>
    <JssProvider classNamePrefix="App2-">
      <App2 />
    </JssProvider>
  </div>
)
```

# Injection order

Injection of style tags happens in the same order as the `createUseStyles()` invocation. Source order specificity is higher the lower style tag is in the tree. Therefore you should call `createUseStyles` of components you want to override first.

Example

```js
import { defineComponent } from 'vue'
import {createUseStyles} from 'vue-jss'

// Will render first once component mounts, because `createUseStyles()` call order matters.
const useLabelStyles = createUseStyles({
  label: {
    color: 'red'
  }
})

const useButtonStyles = createUseStyles({
  button: {
    color: 'red'
  }
})

// Will render styles first.
const Label = defineComponent({
  setup(p, { slots }) => {
    const classes = useLabelStyles()
    return <label className={classes.button}>{slots.default && slots.default()}</label>
  }
})

const Button = defineComponent({
  setup() {
    const classes = useButtonStyles()
    // The order in which we render those components doesn't matter.
    // What matters is the order of `createUseStyles()` calls.
    return (
      <>
        <button className={classes.button} />
        <Label>my button</Label>
      </>
    )
  }
})
```
