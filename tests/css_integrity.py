"""Parse production CSS, including selectors hidden inside responsive rules."""
from pathlib import Path
import tinycss2 as css
import cssselect2

def tokens_ok(tokens,path):
 for token in tokens:
  assert token.type!='error',(str(path),token.source_line,token.message)
  for name in ('content','arguments'):
   child=getattr(token,name,None)
   if child is not None:tokens_ok(child,path)

def check_rules(rules,path):
 for rule in rules:
  assert rule.type!='error',(str(path),rule.source_line,rule.message)
  if rule.type=='qualified-rule':
   tokens_ok(rule.prelude,path)
   try:cssselect2.compile_selector_list(rule.prelude)
   except cssselect2.SelectorError as error:
    # The parser does not implement browser-specific input pseudo-elements.
    if 'pseudo-element' not in str(error) and 'Unknown pseudo-class' not in str(error):raise
   tokens_ok(rule.content,path)
  elif rule.type=='at-rule' and rule.content is not None:
   tokens_ok(rule.content,path)
   if rule.lower_at_keyword in ('media','supports','container','layer'):check_rules(css.parse_rule_list(rule.content),path)
for path in Path('.').glob('*.css'):check_rules(css.parse_stylesheet(path.read_text()),path)
print('CSS syntax and responsive selectors: OK')
