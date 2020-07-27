const jss = require('jss').default

const sheet = jss
  .createStyleSheet(
    {
      // "button" is a rule name; a class gets generated.
      button: {
        width: 100,
        height: ({ h }= { h: 1 }) => h
      }
    },
    {media: 'print'}
  )
  .attach()

console.log(sheet.toString()) // button-d4f43g

sheet.update({
  h: 100
})

console.log(sheet.toString())