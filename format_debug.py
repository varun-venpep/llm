with open("debug.tsx", "r") as f:
    text = f.read()

# Remove the line with </div> that causes ')' expected
text = text.replace("                                        </div>\n                                    )}", "                                    )}")

# Add react component wrapper
text = "export default function Test() { return (<>\n" + text + "\n</>);}"

with open("debug_wrapped.tsx", "w") as f:
    f.write(text)
