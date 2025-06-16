# 🎯 Claude Bot Model Quick Reference

## Quick Commands

### For Advanced/Complex Tasks
```
@claude /model advanced ...
@claude /model 4 ...
@claude smart mode ...
```

### For Fast/Simple Tasks
```
@claude /model fast ...
@claude /model 3.5 ...
@claude quick mode ...
```

### For Latest Features
```
@claude /model latest ...
@claude /model 3.7 ...
@claude newest mode ...
```

## Model Mapping

| Your Input | Model Used | Best For |
|------------|------------|----------|
| `advanced`, `smart`, `deep`, `4` | Sonnet 4 | Complex analysis, detailed reports |
| `fast`, `balanced`, `quick`, `3.5` | Sonnet 3.5 | General queries, quick responses |
| `latest`, `newest`, `3.7` | Sonnet 3.7 | Testing new features |

## All Valid Patterns

### Slash Style
- `/model <name>`
- `/mode <name>`

### Natural Language
- `using <name>`
- `with <name>`
- `model: <name>`

### Mode Style
- `<name> mode`

## Auto-Selection

These words trigger advanced model automatically:
- comprehensive
- detailed
- thorough
- complex
- advanced

## Examples

```bash
# Advanced tasks
@claude /model 4 analyze our quarterly performance
@claude advanced mode create architecture diagram
@claude write a comprehensive technical guide

# Quick tasks
@claude /model fast what's the weather?
@claude quick mode calculate 15% of 2500

# Latest model
@claude /model latest test new capabilities
@claude newest mode experimental features
```

## Default

If no model specified → Sonnet 3.5 (balanced performance)