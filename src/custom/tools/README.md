# Custom Tools

Add your custom API tool integrations here.

Each tool should be a separate TypeScript file exporting a handler function.

## Example

```typescript
// src/custom/tools/weather.ts
export async function getWeather(city: string): Promise<string> {
  // Call your weather API here
  return `The weather in ${city} is sunny.`;
}
```

Then create an API route at `src/app/api/tools/weather/route.ts` to expose it.
