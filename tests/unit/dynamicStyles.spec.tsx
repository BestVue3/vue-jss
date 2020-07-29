/* eslint-disable react/prop-types */

import { createUseStyles } from '../../lib'
import createDynamicStylesTests from '../utils/createDynamicStylesTests'

describe('Vue-JSS: dynamic styles', () => {
  describe('using createUseStyles', () => {
    const createStyledComponent = (
      styles: any,
      options: any = {},
      getClass: any,
    ) => {
      const useStyles = createUseStyles(styles, options)
      const Comp = {
        props: {
          height: [String, Number],
          getClasses: {
            type: Function,
            default: getClass,
          },
          color: {},
        },
        setup(props: any) {
          const classes = useStyles(props)

          if (props.getClasses) props.getClasses(classes.value)
          return () => {
            return <div>123</div>
          }
        },
      }
      return Comp
    }

    createDynamicStylesTests({ createStyledComponent })
  })
})
