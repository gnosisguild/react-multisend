(window.webpackJsonp=window.webpackJsonp||[]).push([[8],{UqAb:function(e,n,t){"use strict";t.r(n),t.d(n,"_frontmatter",(function(){return f})),t.d(n,"default",(function(){return _}));var a=t("Fcif"),o=t("+I+c"),c=t("mXGw"),r=t("/FXl"),s=t("TjRS"),i=t("ZFoC"),d=t("bGYK"),u=t("ICjU"),b=t("bzer"),l=t("r9JW"),m=(t("aD51"),["components"]),f={};void 0!==f&&f&&f===Object(f)&&Object.isExtensible(f)&&!f.hasOwnProperty("__filemeta")&&Object.defineProperty(f,"__filemeta",{configurable:!0,value:{name:"_frontmatter",filename:"example/TransactionBatch.mdx"}});var p={_frontmatter:f},x=s.a;function _(e){var n,t=e.components,_=Object(o.a)(e,m);return Object(r.b)(x,Object(a.a)({},p,_,{components:t,mdxType:"MDXLayout"}),Object(r.b)("h1",{id:"transaction-batch-example"},"Transaction Batch Example"),Object(r.b)(i.c,{__position:0,__code:'() => {\n  const [batch, setBatch] = React.useState([\n    createTransaction(TransactionType.sendFunds, nanoid()),\n  ])\n  return (\n    <ProvideMultiSendContext\n      safeAddress="0x1076f084A3703E1701a1a97F837906e56370D4f9"\n      network="4"\n    >\n      <TransactionBatch\n        value={batch}\n        onChange={setBatch}\n        classNames={classNames}\n      />\n    </ProvideMultiSendContext>\n  )\n}',__scope:(n={props:_,DefaultLayout:s.a,Playground:i.c,Props:i.d,nanoid:d.a,TransactionBatch:u.a,ProvideMultiSendContext:b.a,createTransaction:b.e,TransactionType:b.d,classNames:l},n.DefaultLayout=s.a,n._frontmatter=f,n),mdxType:"Playground"},(function(){var e=c.useState([Object(b.e)(b.d.sendFunds,Object(d.a)())]),n=e[0],t=e[1];return Object(r.b)(b.a,{safeAddress:"0x1076f084A3703E1701a1a97F837906e56370D4f9",network:"4",mdxType:"ProvideMultiSendContext"},Object(r.b)(u.a,{value:n,onChange:t,classNames:l,mdxType:"TransactionBatch"}))})))}void 0!==_&&_&&_===Object(_)&&Object.isExtensible(_)&&!_.hasOwnProperty("__filemeta")&&Object.defineProperty(_,"__filemeta",{configurable:!0,value:{name:"MDXContent",filename:"example/TransactionBatch.mdx"}}),_.isMDXComponent=!0}}]);
//# sourceMappingURL=component---example-transaction-batch-mdx-8cc266965dd7f5689e51.js.map