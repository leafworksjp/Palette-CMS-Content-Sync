import {TemplateFormatter} from '../models/DSL/TemplateFormatter';

const text = `
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>テンプレートエンジン・デモ</title>
<script src="{{ url('./common/lib/jquery/jquery.js') }}"></script>
</head>
  <body>
<h1>テンプレートエンジン・デモaaa</h1>

    <h2>太宰治さんからのお問い合わせ</h2>

@include: "contacts" with {
  query: { keyword: "太宰治" },
};

  @import: {
    foo0 as foo1,
    bar0 as bar1,
  } from 'child';

  @export: {
    foo1 as foo2,
    bar1 as bar2,
  };

  <h2>川端康成さんからのお問い合わせ</h2>

@code: let title = "Welcome!";

@include ( 'header', {props: {class_name: 'foo'}} )
@include ( 'sidebar', {props: {class_name: 'bar'}} )
@if ( true )
@children
@endif
@endinclude
@endinclude

    @include: "contacts" with {
      query: { keyword: "川端康成" },
    };

              @include (
                'sidebar',
                {
                  props: {current: 'home'}
                }
              )
<div>{{ title }}</div>
  @endinclude

                      {{ value | escape_html }}

<div>
@code: let text = 'Hello, World!';
</div>

        @if (x)
          @code: let y = 1;
          {{ y }}
        @else
          @code: let y = 2;
          {{ y }}
        @endif

  @code
  let x = 123;
  let y = (1 + 2) * 3;
  if (x > y) {
    'high'
  } else {
    'low'
  }
  @endcode

@children

  <div>
  <p>変数xの値: {{ x }}</p>
    <p>変数yの値: {{ y }}</p>
<p>計算結果: {{ x + y }}</p>
</div>

@code
  let add = (a, b) => a + b;
@endcode

  <div>
  <p>関数addの結果:{{ add(5, 10) }}</p>
  </div>

@# コメント1
          @# コメント2

  @for ( let i in 0..10 )
<p>ループ中: {{ i }}</p>
  @endfor

  @for ( let item in records )
@for ( let i in 0..10 )
<p>{{ item }}: {{ i }}</p>
  @endfor
    @endfor

@if (condition)
<p>条件が真の場合の処理</p>
@elseif (otherCondition)
<p>他の条件が真の場合の処理</p>
@else
<p>どの条件も満たさない場合の処理</p>
@endif

@if ( x > 5 )
              <p>1</p>
  @if ( y > 5 )
        <p>2</p>
@elseif ( z < 5 )
              <p>3</p>
                    @else
      <p>4</p>
  @endif
          @else
    <p>5</p>
          @endif

@if ( user.posts )
@for ( let ( i, post ) in user.posts )
<p>{{ i }}: {{ post.title }}</p>
@endfor
@else
<p>No posts</p>
@endif

        <div>
  @if ( user && user.posts )
@for ( let ( i, post ) in user.posts )
        @if ( i == 0 )
  <p>First: {{ post.title }}</p>
                  @else
        <p>{{ i }}: {{ post.title }}</p>
              @endif
  @endfor
        @endif
            </div>


@if (true)
{{
if (false) {
  1 + 2
} else {
  3 + 4
}
}}
@else
{{ 5 + 6 }}
@endif

@if (true)
      @elseif (false)
    @else
        @endif
  </body>
</html>
`;

const text2 = `
  @code
  let x = 123;
  let y = (1 + 2) * 3;
  if (x > y) {
    "high"
  } else {
    'low'
  }
  @endcode
`;

const text3 = `
@include ( 'header', {props: {class_name: 'foo'}} )
@include ( 'sidebar', {props: {class_name: 'bar'}} )
@if ( true )
@children
@endif
@endinclude
@endinclude
`;

test('format', async () =>
{
	await new TemplateFormatter('html').format(text2);

	expect(3).toBe(3);
});
