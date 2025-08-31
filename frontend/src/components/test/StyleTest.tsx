'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function StyleTest() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-4xl font-bold text-gray-900">Tailwind Style Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl text-blue-600">Card 1</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">This is a test card with proper Tailwind styling.</p>
            <Button className="w-full">Primary Button</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl text-green-600">Card 2</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Another test card to verify responsive design.</p>
            <Button variant="outline" className="w-full">Outline Button</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl text-purple-600">Card 3</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Third card with badge styling.</p>
            <Badge variant="secondary" className="mb-4">Test Badge</Badge>
            <Button variant="secondary" className="w-full">Secondary Button</Button>
          </CardContent>
        </Card>
      </div>

      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">Gradient Background Test</h2>
        <p>This section tests gradient backgrounds and white text.</p>
      </div>
    </div>
  )
}
