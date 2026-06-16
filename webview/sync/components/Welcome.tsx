import {Locale} from '../locales/ja';

export const Welcome = () =>
{
	return (
		<div className="welcome">
			<p>{Locale.welcome}</p>
		</div>
	);
};
